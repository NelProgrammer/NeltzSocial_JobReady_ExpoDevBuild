param (
    [string]$Device = "emulator-5554",
    [string]$Suite = "",
    [string]$Action = "",
    [string]$Tab = "",
    [string]$Coords = "",
    [string]$Text = "",
    [string]$Capture = "",
    [string]$ArtifactDir = "C:\Users\Drow\.gemini\antigravity-ide\brain\3b8b00d1-bdad-45cd-ba09-00e43e053dc0",
    [int]$DelayMs = 800,
    [string]$DbContainer = "jobready_postgres_db",
    [string]$DbName = "jobready_db",
    [string]$DbUser = "postgres",
    [string]$ApiBase = "",
    [string]$Package = "com.neltzsocial.jobready.offline"
)

# Native adb writes progress to stderr; do not treat that as a terminating error.
$ErrorActionPreference = "Continue"
$script:Failed = $false
$script:FailReasons = New-Object System.Collections.Generic.List[string]
$script:SawUi = $false
$script:SawLocal = $false
$script:SawHttp = $false
$script:SawDb = $false
$script:Job2Base = ""
$script:LastToken = ""

function Fail-Step([string]$reason) {
    $script:Failed = $true
    $script:FailReasons.Add($reason) | Out-Null
    Write-Host "  [FAIL] $reason" -ForegroundColor Red
}

function Resolve-Device([string]$requested) {
    $name = $requested.Trim()
    if ($name -match '^(medium_phone|Medium_Phone)$') {
        # Do not call `adb emu avd name` — it hangs (exit -1 / 4294967295, no stdout).
        $serials = @(adb devices | Select-String -Pattern "device$" | ForEach-Object { ($_ -split "\s+")[0] })
        $emu = @($serials | Where-Object { $_ -match '^emulator-' })
        if ($emu.Count -gt 0) { return $emu[0] }
        if ($serials.Count -gt 0) { return $serials[0] }
        return "emulator-5554"
    }
    if ($name -eq "phone") {
        $devices = adb devices | Select-String -Pattern "device$" | ForEach-Object { ($_ -split "\s+")[0] } | Where-Object { $_ -notmatch "emulator" }
        if ($devices) { return $devices[0] }
        Write-Warning "No physical device detected. Falling back to emulator-5554"
        return "emulator-5554"
    }
    return $name
}

$Device = Resolve-Device $Device

$tabLabels = @{
    "personal"      = "Personal"
    "education"     = "Education"
    "experience"    = "Experience"
    "references"    = "References"
    "skills"        = "Skills"
    "edit_fab"      = "Edit"
    "resumebuilder" = "Resume Builder"
    "pdfworkbench"  = "PDF Workbench"
    "back_button"   = $null
    "footer_home"   = "JobReady Hub"
    "configure_btn" = "Configure Fields"
    "footer_gear"   = "App Settings"
    "preview_cv"    = "Preview CV"
}

function Capture-ScreenStream([string]$targetDev, [string]$outPath) {
    $dir = Split-Path -Parent $outPath
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Write-Host "  Capturing screen to: $outPath" -ForegroundColor DarkGray
    cmd.exe /c "adb -s $targetDev exec-out screencap -p > `"$outPath`""
    if (-not (Test-Path $outPath) -or ((Get-Item $outPath).Length -lt 1000)) {
        Fail-Step "Screenshot missing or too small: $outPath"
        return
    }
    Write-Host "  [OK] Screenshot saved ($((Get-Item $outPath).Length) bytes)" -ForegroundColor Green
}

function Get-UiNodes([string]$targetDev) {
    $remote = "/sdcard/jr_uidump.xml"
    $local = Join-Path $env:TEMP "jr_uidump_$targetDev.xml"
    cmd.exe /c "adb -s $targetDev shell uiautomator dump $remote >nul 2>&1"
    cmd.exe /c "adb -s $targetDev pull $remote `"$local`" >nul 2>&1"
    if (-not (Test-Path $local)) { return @() }
    try { [xml]$doc = Get-Content -Raw $local } catch { return @() }
    $nodes = New-Object System.Collections.Generic.List[object]
    function Walk($n) {
        if (-not $n) { return }
        $bounds = $n.bounds
        $x1 = 0; $y1 = 0; $x2 = 0; $y2 = 0
        if ($bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $x1 = [int]$Matches[1]; $y1 = [int]$Matches[2]; $x2 = [int]$Matches[3]; $y2 = [int]$Matches[4]
        }
        $w = $x2 - $x1
        $h = $y2 - $y1
        # Clipped RN nodes can report inverted bounds; mark unusable with area 0.
        $area = if ($w -gt 0 -and $h -gt 0) { $w * $h } else { 0 }
        $nodes.Add([pscustomobject]@{
            text = [string]$n.text
            desc = [string]$n.'content-desc'
            cx = [int](($x1 + $x2) / 2)
            cy = [int](($y1 + $y2) / 2)
            area = $area
        }) | Out-Null
        foreach ($c in $n.node) { Walk $c }
    }
    Walk $doc.hierarchy.node
    return $nodes
}

function Get-UiBlob($nodes) {
    ($nodes | ForEach-Object { @($_.text, $_.desc) } | Where-Object { $_ } | ForEach-Object { $_.Trim() } | Where-Object { $_ }) -join "`n"
}

function Assert-Ui([string]$targetDev, $expect, $forbid) {
    $nodes = Get-UiNodes $targetDev
    $blob = Get-UiBlob $nodes
    if ($blob -match 'Are you sure you want to close JobReady') {
        Fail-Step "Exit confirmation dialog is open. UI is not on the expected screen."
        return $nodes
    }
    foreach ($needle in @($expect)) {
        if (-not $needle) { continue }
        if ($blob -notmatch [regex]::Escape([string]$needle)) {
            $sample = (($blob -split "`n") | Select-Object -First 12) -join ' | '
            Fail-Step "Expected UI text '$needle' not found. Visible: $sample"
        }
    }
    foreach ($needle in @($forbid)) {
        if (-not $needle) { continue }
        if ($blob -match [regex]::Escape([string]$needle)) {
            Fail-Step "Forbidden UI text '$needle' is visible."
        }
    }
    if (@($expect).Count -gt 0 -and -not $script:Failed) { $script:SawUi = $true }
    return $nodes
}

function Resolve-Job2 {
    if ($script:Job2Base) { return $script:Job2Base }
    foreach ($base in @("http://127.0.0.1:3000", "http://127.0.0.1:8000")) {
        try {
            $r = Invoke-RestMethod -Uri "$base/health" -Method GET -TimeoutSec 4
            if ($r.database_connected -eq $true -or $r.status -eq "online") {
                $script:Job2Base = $base
                Write-Host "  Job 2: $base" -ForegroundColor DarkGray
                return $base
            }
        } catch { }
    }
    Fail-Step "No Job 2 API with database_connected on :3000 or :8000."
    return $null
}

function Invoke-AssertHttp($step) {
    $base = if ($step.base) { [string]$step.base } else { Resolve-Job2 }
    if (-not $base) { return }
    $method = if ($step.method) { [string]$step.method } else { "GET" }
    $path = [string]$step.path
    if (-not $path) { Fail-Step "assert-http missing path"; return }
    $url = "$base$path"
    $headers = @{ "Content-Type" = "application/json" }
    $token = if ($step.token) { [string]$step.token } else { $script:LastToken }
    if ($token) { $headers.Authorization = "Bearer $token" }
    $bodyJson = $null
    if ($null -ne $step.body) { $bodyJson = ($step.body | ConvertTo-Json -Compress -Depth 8) }
    try {
        if ($bodyJson) {
            $resp = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -Body $bodyJson -TimeoutSec 8 -UseBasicParsing
        } else {
            $resp = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -TimeoutSec 8 -UseBasicParsing
        }
    } catch {
        Fail-Step "assert-http $method $url failed: $($_.Exception.Message)"
        return
    }
    $wantStatus = if ($step.status) { [int]$step.status } else { 200 }
    if ([int]$resp.StatusCode -ne $wantStatus) {
        Fail-Step "assert-http $method $url status $($resp.StatusCode) expected $wantStatus"
        return
    }
    $text = [string]$resp.Content
    Write-Host "  HTTP $method $path $($resp.StatusCode)" -ForegroundColor DarkGray
    $expect = Get-StepExpect $step
    if ($expect.Count -eq 0) {
        Fail-Step "assert-http requires expect[]. Status-only is a false success."
        return
    }
    foreach ($needle in $expect) {
        if ($text -notmatch [regex]::Escape([string]$needle)) {
            Fail-Step "assert-http body missing '$needle'. Got: $($text.Substring(0, [Math]::Min(240, $text.Length)))"
        }
    }
    if ($step.saveToken -eq $true) {
        try {
            $parsed = $text | ConvertFrom-Json
            if ($parsed.access_token) { $script:LastToken = [string]$parsed.access_token }
            else { Fail-Step "saveToken set but no access_token in response." }
        } catch {
            Fail-Step "saveToken set but response is not JSON."
        }
    }
    $script:SawHttp = $true
}

function Invoke-AssertLocal([string]$targetDev, [string]$pkg, $expect) {
    if (-not $expect -or @($expect).Count -eq 0) {
        Fail-Step "assert-local requires expect[]."
        return
    }
    # Isolate this step from earlier suite failures so a prior miss does not block SawLocal.
    $priorFailed = $script:Failed
    $script:Failed = $false
    $localOk = $false

    $shell = "run-as $pkg sh -c 'for d in files/AsyncStorage files/RCTAsyncLocalStorage_V1 files databases shared_prefs; do [ -d `$d ] && find `$d -type f 2>/dev/null; done | while read f; do echo FILE:`$f; strings `$f 2>/dev/null || cat `$f 2>/dev/null; done'"
    $blob = adb -s $targetDev shell $shell 2>&1
    $text = [string]$blob
    $dumpOk = $LASTEXITCODE -eq 0 -and $text -and ($text -notmatch 'run-as:') -and ($text -notmatch 'Permission denied') -and ($text.Length -gt 20)

    if ($dumpOk) {
        Write-Host "  Local storage dump $($text.Length) chars" -ForegroundColor DarkGray
        foreach ($needle in @($expect)) {
            if ($text -notmatch [regex]::Escape([string]$needle)) {
                $sample = $text.Substring(0, [Math]::Min(300, $text.Length))
                Fail-Step "Local storage missing '$needle'. Sample: $sample"
            }
        }
        if (-not $script:Failed) { $localOk = $true }
    } else {
        # Release / non-debuggable APK: prove AsyncStorage by cold restart persistence on UI.
        Write-Host "  Local dump unavailable for $pkg (not debuggable). Proving via force-stop + relaunch." -ForegroundColor Yellow
        Assert-Ui $targetDev $expect @() | Out-Null
        if (-not $script:Failed) {
            cmd.exe /c "adb -s $targetDev shell am force-stop $pkg >nul 2>&1"
            Start-Sleep -Milliseconds 1000
            cmd.exe /c "adb -s $targetDev shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 >nul 2>&1"
            Start-Sleep -Milliseconds 3500
            Dismiss-ExitIfPresent $targetDev
            Assert-Ui $targetDev $expect @() | Out-Null
            if (-not $script:Failed) { $localOk = $true }
        }
    }

    if ($localOk) {
        Write-Host "  [OK] Local persistence matched." -ForegroundColor Green
        $script:SawLocal = $true
    }
    if ($priorFailed) { $script:Failed = $true }
}

function Find-UiNode($nodes, [string]$needle) {
    if (-not $needle) { return $null }
    # Prefer positive area (reject inverted/clipped off-screen bounds from RN scroll views).
    # Also reject near-fullscreen scrims (e.g. content-desc "Close modal") that steal taps.
    $usable = @($nodes | Where-Object { $_.area -gt 0 -and $_.area -lt 900000 })
    $exact = $usable | Where-Object { $_.text -eq $needle -or $_.desc -eq $needle } | Sort-Object area | Select-Object -First 1
    if ($exact) { return $exact }
    $contains = $usable | Where-Object {
        ($_.text -and $_.text.IndexOf($needle, [StringComparison]::OrdinalIgnoreCase) -ge 0) -or
        ($_.desc -and $_.desc.IndexOf($needle, [StringComparison]::OrdinalIgnoreCase) -ge 0)
    } | Sort-Object area | Select-Object -First 1
    return $contains
}

function Find-FooterBandIcon($nodes, [string]$side) {
    # Release APK footers often use icon-only buttons without text labels.
    $maxY = ($nodes | Measure-Object -Property cy -Maximum).Maximum
    if (-not $maxY -or $maxY -lt 200) { return $null }
    $band = [int]($maxY * 0.88)
    $inBand = @(
        $nodes | Where-Object {
            $_.cy -ge $band -and
            $_.area -gt 500 -and $_.area -lt 40000
        }
    )
    if ($side -eq 'left') {
        $candidates = @($inBand | Where-Object { $_.cx -lt 220 } | Sort-Object cx, area)
        if ($candidates.Count -gt 0) { return $candidates[0] }
    } elseif ($side -eq 'right') {
        $maxX = ($inBand | Measure-Object -Property cx -Maximum).Maximum
        $candidates = @($inBand | Where-Object { $_.cx -ge ($maxX - 80) } | Sort-Object @{Expression='cx';Descending=$true}, area)
        if ($candidates.Count -gt 0) { return $candidates[0] }
    }
    return $null
}

function Tap-UiText([string]$targetDev, [string]$needle, [string]$FooterFallback = "", [switch]$Optional) {
    $nodes = Get-UiNodes $targetDev
    $hit = Find-UiNode $nodes $needle
    if (-not $hit -and $FooterFallback) {
        $hit = Find-FooterBandIcon $nodes $FooterFallback
        if ($hit) {
            Write-Host "  '$needle' label missing; tapping $FooterFallback footer icon at $($hit.cx) $($hit.cy)" -ForegroundColor Yellow
            adb -s $targetDev shell input tap $hit.cx $hit.cy | Out-Null
            return
        }
    }
    if (-not $hit) {
        if ($Optional) {
            Write-Host "  Optional tap '$needle' skipped (not visible)." -ForegroundColor DarkGray
            return
        }
        $sample = ((Get-UiBlob $nodes) -split "`n" | Select-Object -First 12) -join ' | '
        Fail-Step "Cannot tap '$needle'. Visible: $sample"
        return
    }
    Write-Host "  Tapping '$needle' at $($hit.cx) $($hit.cy)" -ForegroundColor DarkGray
    adb -s $targetDev shell input tap $hit.cx $hit.cy | Out-Null
}

function Type-AdbText([string]$targetDev, [string]$raw) {
    if ($null -eq $raw) { return }
    # Modest clear — long DEL lists stall adb.
    cmd.exe /c "adb -s $targetDev shell input keyevent 123 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67" | Out-Null

    # This emulator types `%40` literally — do not use it for `@`.
    # Split on @ / !: plain segments via `input text` (%s for spaces);
    # `@` => KEYCODE_AT (77); `!` => KEYCODE_PERIOD is wrong — use escaped text \!
    # All adb via cmd.exe (PowerShell stderr / @ stripping).
    $parts = [regex]::Split($raw, '([@!])')
    foreach ($part in $parts) {
        if (-not $part) { continue }
        if ($part -eq '@') {
            cmd.exe /c "adb -s $targetDev shell input keyevent 77" | Out-Null
        } elseif ($part -eq '!') {
            cmd.exe /c "adb -s $targetDev shell input text \!" | Out-Null
        } else {
            $encoded = $part -replace ' ', '%s'
            cmd.exe /c "adb -s $targetDev shell input text `"$encoded`"" | Out-Null
        }
    }
}

function Dismiss-ExitIfPresent([string]$targetDev) {
    $nodes = Get-UiNodes $targetDev
    $blob = Get-UiBlob $nodes
    if ($blob -notmatch 'Are you sure you want to close JobReady') { return }
    Write-Host "  Dismissing leftover Exit dialog..." -ForegroundColor Yellow
    $cancel = Find-UiNode $nodes "CANCEL"
    if ($cancel) {
        adb -s $targetDev shell input tap $cancel.cx $cancel.cy | Out-Null
        Start-Sleep -Milliseconds 600
    }
    $nodes = Get-UiNodes $targetDev
    if ((Get-UiBlob $nodes) -match 'Are you sure you want to close JobReady') {
        Fail-Step "Could not dismiss Exit dialog."
    }
}

function Invoke-ClearApp([string]$targetDev, [string]$pkg) {
    if (-not $pkg) { Fail-Step "clear-app / reset-local missing package."; return }
    Write-Host "  Clearing app data for $pkg (fresh non-online session)..." -ForegroundColor Yellow
    cmd.exe /c "adb -s $targetDev shell pm clear $pkg >nul 2>&1"
    if ($LASTEXITCODE -ne 0) {
        Fail-Step "pm clear failed for $pkg (exit $LASTEXITCODE)."
        return
    }
    Start-Sleep -Milliseconds 800
    cmd.exe /c "adb -s $targetDev shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 >nul 2>&1"
    Start-Sleep -Milliseconds 3500
    Dismiss-ExitIfPresent $targetDev
    Write-Host "  [OK] App cleared and relaunched." -ForegroundColor Green
}

function Invoke-AssertDb([string]$sql, $expect) {
    $running = docker ps --filter "name=$DbContainer" --format "{{.Names}}" 2>$null
    if ($running -notmatch $DbContainer) {
        Fail-Step "Postgres container '$DbContainer' is not running. Cannot prove warehouse rows."
        return
    }
    $output = docker exec $DbContainer psql -U $DbUser -d $DbName -t -A -c $sql 2>&1
    if ($LASTEXITCODE -ne 0) {
        Fail-Step "psql failed: $output"
        return
    }
    $text = [string]$output
    Write-Host "  DB: $text" -ForegroundColor DarkGray
    if (-not $expect -or @($expect).Count -eq 0) {
        Fail-Step "assert-db requires expect[]. A query without assertions is a false success."
        return
    }
    foreach ($needle in @($expect)) {
        if ($text -notmatch [regex]::Escape([string]$needle)) {
            Fail-Step "Warehouse missing '$needle'. Query result: $text"
        }
    }
    $script:SawDb = $true
}

function Invoke-LoadSeed {
    $workspace = "c:\Users\Drow\Documents\Coding_Space\Neltz_Social\JobReady"
    $nodeDir = Join-Path $workspace "NS_JR_Backend_Node"
    $gen = Join-Path $workspace "NS_JR_Backend_DB\seed\generate.ts"
    $load = Join-Path $workspace "NS_JR_Backend_DB\seed\load_http.ts"
    Push-Location $nodeDir
    try {
        npx --yes tsx $gen
        if ($LASTEXITCODE -ne 0) { Fail-Step "seed generate.ts failed."; return }
        npx --yes tsx $load
        if ($LASTEXITCODE -ne 0) { Fail-Step "seed load_http.ts failed. Job 2 must be up with database_connected."; return }
        Write-Host "  [OK] Seed accounts loaded through Job 2 HTTP." -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

function Get-StepExpect($step) {
    if ($null -eq $step.expect) { return @() }
    if ($step.expect -is [string]) { return @($step.expect) }
    return @($step.expect)
}

function Get-StepForbid($step) {
    if ($null -eq $step.forbid) { return @() }
    if ($step.forbid -is [string]) { return @($step.forbid) }
    return @($step.forbid)
}

function Invoke-Step($step, [string]$targetDev) {
    $action = [string]$step.action
    switch ($action.ToLower()) {
        "dismiss-exit" { Dismiss-ExitIfPresent $targetDev }
        "clear-app" {
            $pkg = if ($step.package) { [string]$step.package } else { $script:TargetPkg }
            Invoke-ClearApp $targetDev $pkg
        }
        "reset-local" {
            $pkg = if ($step.package) { [string]$step.package } else { $script:TargetPkg }
            Invoke-ClearApp $targetDev $pkg
        }
        "launch" {
            $pkg = if ($step.package) { [string]$step.package } else { $script:TargetPkg }
            cmd.exe /c "adb -s $targetDev shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 >nul 2>&1"
            Start-Sleep -Milliseconds 2000
            Dismiss-ExitIfPresent $targetDev
        }
        "load-seed" { Invoke-LoadSeed }
        "assert-db" {
            if (-not $step.sql) { Fail-Step "assert-db missing sql"; break }
            Invoke-AssertDb -sql $step.sql -expect (Get-StepExpect $step)
        }
        "assert-http" { Invoke-AssertHttp $step }
        "assert-local" {
            $pkg = if ($step.package) { [string]$step.package } else { $script:TargetPkg }
            Invoke-AssertLocal $targetDev $pkg (Get-StepExpect $step)
        }
        "assert-ui" {
            $exp = Get-StepExpect $step
            if ($exp.Count -eq 0) { Fail-Step "assert-ui requires expect[]"; break }
            Assert-Ui $targetDev $exp (Get-StepForbid $step) | Out-Null
        }
        "tap-text" {
            if (-not $step.text -and -not $step.target) { Fail-Step "tap-text missing text/target"; break }
            $label = if ($step.text) { $step.text } else { $step.target }
            if ($step.optional -eq $true) {
                Tap-UiText $targetDev $label -Optional
            } else {
                Tap-UiText $targetDev $label
            }
        }
        "tap-tab" {
            $tabName = ([string]$step.target).ToLower()
            $label = $tabLabels[$tabName]
            if (-not $label) { Fail-Step "Unknown tab '$tabName'"; break }
            Tap-UiText $targetDev $label
        }
        "tap-target" {
            $key = ([string]$step.target).ToLower()
            $label = $tabLabels[$key]
            if (-not $label) { Fail-Step "Unknown target '$key' - use tap-text with on-screen copy."; break }
            if ($key -eq "footer_home") {
                Tap-UiText $targetDev $label -FooterFallback "left"
            } elseif ($key -eq "footer_gear") {
                Tap-UiText $targetDev $label -FooterFallback "right"
            } else {
                Tap-UiText $targetDev $label
            }
        }
        "tap-coords" {
            Fail-Step "tap-coords is forbidden. Stale pixels caused false successes. Use tap-text."
        }
        "type-text" {
            Type-AdbText $targetDev $step.text
        }
        "swipe" {
            adb -s $targetDev shell input swipe $step.coords | Out-Null
        }
        "key" {
            adb -s $targetDev shell input keyevent "$($step.key)" | Out-Null
        }
        "wait" { }
        "capture" {
            $exp = Get-StepExpect $step
            if ($exp.Count -eq 0) {
                Fail-Step "capture '$($step.output)' has no expect[]. Screenshots are not a pass."
                break
            }
            $outName = $step.output
            $fullOut = Join-Path $ArtifactDir $outName
            Capture-ScreenStream -targetDev $targetDev -outPath $fullOut
            Assert-Ui $targetDev $exp (Get-StepForbid $step) | Out-Null
        }
        default { Fail-Step "Unknown action '$action'" }
    }
}

if ($Action -ne "") {
    switch ($Action.ToLower()) {
        "switch-tab" {
            $key = $Tab.ToLower()
            $label = $tabLabels[$key]
            if (-not $label) { Fail-Step "Unknown tab '$Tab'"; exit 1 }
            if ($key -eq "footer_home") { Tap-UiText $Device $label -FooterFallback "left" }
            elseif ($key -eq "footer_gear") { Tap-UiText $Device $label -FooterFallback "right" }
            else { Tap-UiText $Device $label }
        }
        "tap" { adb -s $Device shell input tap $Coords | Out-Null }
        "swipe" { adb -s $Device shell input swipe $Coords | Out-Null }
        "type-text" { Type-AdbText $Device $Text }
        "clear-app" { Invoke-ClearApp $Device $Package }
        "reset-local" { Invoke-ClearApp $Device $Package }
        "home" { adb -s $Device shell input keyevent KEYCODE_HOME | Out-Null }
        "back" { adb -s $Device shell input keyevent KEYCODE_BACK | Out-Null }
        "capture" { Capture-ScreenStream -targetDev $Device -outPath $Capture }
        default { Fail-Step "Unknown ad-hoc action '$Action'" }
    }
    if ($DelayMs -gt 0) { Start-Sleep -Milliseconds $DelayMs }
    if ($Capture -ne "" -and $Action -ne "capture") {
        Capture-ScreenStream -targetDev $Device -outPath $Capture
    }
    if ($script:Failed) { exit 1 }
    exit 0
}

if ($Suite -eq "") {
    Write-Host "Usage: test_driver.ps1 -Suite SUITE_NAME [-Device emulator-5554|medium_phone|phone]"
    Write-Host "A run with no suite and no action is a failure, not a success."
    exit 1
}

$suiteFile = $Suite
if (-not (Test-Path $suiteFile)) {
    $suiteFile = Join-Path $PSScriptRoot "scenarios\$Suite.json"
}
if (-not (Test-Path $suiteFile)) {
    Write-Error "Suite file not found: $suiteFile"
    exit 1
}

$suiteJson = Get-Content -Raw $suiteFile | ConvertFrom-Json
if (-not $suiteJson.steps -or $suiteJson.steps.Count -eq 0) {
    Write-Error "Suite has no steps."
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "[RUNNING TEST SUITE] $($suiteJson.name)" -ForegroundColor Cyan
Write-Host "Description: $($suiteJson.description)" -ForegroundColor DarkGray
Write-Host "Target Device: $Device" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$targetPkg = if ($suiteJson.package) { $suiteJson.package } else { "com.neltzsocial.jobready.offline" }
$script:TargetPkg = $targetPkg
if ($suiteJson.skipLaunch -ne $true) {
    Write-Host "Bringing $targetPkg to foreground..." -ForegroundColor DarkGray
    cmd.exe /c "adb -s $Device shell monkey -p $targetPkg -c android.intent.category.LAUNCHER 1 >nul 2>&1"
    Start-Sleep -Milliseconds 2500
    Dismiss-ExitIfPresent $Device
}

$stepIndex = 1
foreach ($step in $suiteJson.steps) {
    Write-Host "[$stepIndex/$($suiteJson.steps.Count)] $($step.description)" -ForegroundColor Yellow
    Invoke-Step $step $Device
    $stepDelay = if ($step.delayMs) { [int]$step.delayMs } else { $DelayMs }
    if ($stepDelay -gt 0) { Start-Sleep -Milliseconds $stepDelay }
    $stepIndex++
}

$requireFour = ($suiteJson.requireFourState -eq $true)
if ($requireFour) {
    if (-not $script:SawUi) { Fail-Step "Four-state suite missing Frontend (assert-ui) proof." }
    if (-not $script:SawLocal) { Fail-Step "Four-state suite missing Local storage (assert-local) proof." }
    if (-not $script:SawHttp) { Fail-Step "Four-state suite missing Backend (assert-http) proof." }
    if (-not $script:SawDb) { Fail-Step "Four-state suite missing DB (assert-db) proof." }
}

if ($script:Failed) {
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "[FAIL] $($suiteJson.name)" -ForegroundColor Red
    $script:FailReasons | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    Write-Host "============================================================" -ForegroundColor Red
    exit 1
}

Write-Host "============================================================" -ForegroundColor Green
if ($requireFour) {
    Write-Host "[SUCCESS] $($suiteJson.name) - Frontend, Local, Backend, and DB all matched" -ForegroundColor Green
} else {
    Write-Host "[SUCCESS] $($suiteJson.name) - live assertions passed" -ForegroundColor Green
}
Write-Host "============================================================" -ForegroundColor Green
exit 0
