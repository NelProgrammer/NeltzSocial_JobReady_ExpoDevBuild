param (
    [string]$Device = "emulator-5554",
    [string]$Suite = "",
    [string]$Action = "",
    [string]$Tab = "",
    [string]$Coords = "",
    [string]$Text = "",
    [string]$Capture = "",
    [string]$ArtifactDir = "C:\Users\Drow\.gemini\antigravity-ide\brain\3b8b00d1-bdad-45cd-ba09-00e43e053dc0",
    [int]$DelayMs = 800
)

# 1. Resolve Target Device
if ($Device -eq "phone") {
    $devices = adb devices | Select-String -Pattern "device$" | ForEach-Object { ($_ -split "\s+")[0] } | Where-Object { $_ -notmatch "emulator" }
    if ($devices) {
        $Device = $devices[0]
        Write-Host "Targeting physical device: $Device" -ForegroundColor Cyan
    } else {
        Write-Warning "No physical device detected. Falling back to emulator-5554"
        $Device = "emulator-5554"
    }
}

# 2. Canonical Coordinates Mapping (1080x2400 baseline from layout dump)
$tabMap = @{
    "personal"      = "124 366"
    "education"     = "331 366"
    "experience"    = "552 366"
    "references"    = "784 366"
    "skills"        = "978 366"
    "edit_fab"      = "991 153"
    "resumebuilder" = "540 625"
    "pdfworkbench"  = "540 735"
    "back_button"   = "89 153"
    "footer_home"   = "92 2265"
    "configure_btn" = "507 2265"
    "footer_gear"   = "988 2265"
}

# Helper to capture screenshot using raw binary stream to avoid Windows UTF-16 corruption
function Capture-ScreenStream([string]$targetDev, [string]$outPath) {
    Write-Host "  Capturing screen to: $outPath" -ForegroundColor DarkGray
    cmd.exe /c "adb -s $targetDev exec-out screencap -p > `"$outPath`""
    if (Test-Path $outPath) {
        $len = (Get-Item $outPath).Length
        Write-Host "  [OK] Screenshot saved (${len} bytes)" -ForegroundColor Green
    } else {
        Write-Error "Failed to capture screenshot: $outPath"
    }
}

# 3. Handle Single Ad-Hoc Actions
if ($Action -ne "") {
    switch ($Action.ToLower()) {
        "switch-tab" {
            if ($tabMap.ContainsKey($Tab.ToLower())) {
                $pos = $tabMap[$Tab.ToLower()]
                Write-Host "Switching to tab '$Tab' ($pos)..." -ForegroundColor Yellow
                adb -s $Device shell input tap $pos
            } else {
                Write-Error "Unknown tab '$Tab'"
                exit 1
            }
        }
        "tap" {
            Write-Host "Tapping: $Coords..." -ForegroundColor Yellow
            adb -s $Device shell input tap $Coords
        }
        "type-text" {
            Write-Host "Typing: '$Text'..." -ForegroundColor Yellow
            adb -s $Device shell input text "$Text"
        }
        "capture" {
            Capture-ScreenStream -targetDev $Device -outPath $Capture
        }
    }
    if ($DelayMs -gt 0) { Start-Sleep -Milliseconds $DelayMs }
    if ($Capture -ne "" -and $Action -ne "capture") {
        Capture-ScreenStream -targetDev $Device -outPath $Capture
    }
    exit 0
}

# 4. Handle Declarative Suite Execution
if ($Suite -ne "") {
    $suiteFile = $Suite
    if (-not (Test-Path $suiteFile)) {
        $suiteFile = Join-Path $PSScriptRoot "scenarios\$Suite.json"
    }
    if (-not (Test-Path $suiteFile)) {
        Write-Error "Suite file not found: $suiteFile"
        exit 1
    }

    $suiteJson = Get-Content -Raw $suiteFile | ConvertFrom-Json
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "[RUNNING TEST SUITE] $($suiteJson.name)" -ForegroundColor Cyan
    Write-Host "Description: $($suiteJson.description)" -ForegroundColor DarkGray
    Write-Host "Target Device: $Device" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan

    $stepIndex = 1
    foreach ($step in $suiteJson.steps) {
        Write-Host "[$stepIndex/$($suiteJson.steps.Count)] $($step.description)" -ForegroundColor Yellow
        switch ($step.action) {
            "tap-tab" {
                $tabName = $step.target.ToLower()
                if ($tabMap.ContainsKey($tabName)) {
                    $pos = $tabMap[$tabName]
                    adb -s $Device shell input tap $pos
                } else {
                    Write-Error "Unknown tab target '$tabName'"
                }
            }
            "tap-coords" {
                adb -s $Device shell input tap $step.coords
            }
            "tap-target" {
                $targetKey = $step.target.ToLower()
                if ($tabMap.ContainsKey($targetKey)) {
                    adb -s $Device shell input tap $tabMap[$targetKey]
                } else {
                    Write-Error "Unknown target key '$targetKey'"
                }
            }
            "type-text" {
                adb -s $Device shell input text "$($step.text)"
            }
            "swipe" {
                adb -s $Device shell input swipe $step.coords
            }
            "key" {
                adb -s $Device shell input keyevent "$($step.key)"
            }
            "wait" {
                Start-Sleep -Milliseconds $step.delayMs
            }
            "capture" {
                $outName = $step.output
                $fullOut = Join-Path $ArtifactDir $outName
                Capture-ScreenStream -targetDev $Device -outPath $fullOut
            }
        }
        
        $stepDelay = if ($step.delayMs) { $step.delayMs } else { $DelayMs }
        Start-Sleep -Milliseconds $stepDelay
        $stepIndex++
    }

    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] TEST SUITE FINISHED: $($suiteJson.name)" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
}
