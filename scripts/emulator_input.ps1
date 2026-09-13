param (
    [string]$Device = "emulator-5554",
    [string]$Tap = "",
    [string]$Tab = "",
    [string]$Text = "",
    [string]$Key = "",
    [string]$Swipe = "",
    [string]$Capture = "",
    [int]$DelayMs = 1000
)

# Resolve device (phone vs emulator)
if ($Device -eq "phone") {
    $devices = adb devices | Select-String -Pattern "device$" | ForEach-Object { ($_ -split "\s+")[0] } | Where-Object { $_ -notmatch "emulator" }
    if ($devices) {
        $Device = $devices[0]
        Write-Host "Targeting physical device: $Device"
    } else {
        Write-Warning "No physical device detected. Falling back to emulator-5554"
        $Device = "emulator-5554"
    }
}

# Predefined Career Data Tab Coordinates (exact centers from Android layout dump)
$tabMap = @{
    "personal"   = "124 366"
    "education"  = "331 366"
    "experience" = "552 366"
    "references" = "784 366"
    "skills"     = "978 366"
    "resumebuilder" = "540 625"
    "pdfworkbench"  = "540 735"
}

if ($Tab -ne "") {
    $tabKey = $Tab.ToLower()
    if ($tabMap.ContainsKey($tabKey)) {
        $coords = $tabMap[$tabKey]
        Write-Host "Tapping tab '$Tab' at coordinates: $coords on $Device..."
        adb -s $Device shell input tap $coords
    } else {
        Write-Error "Unknown tab '$Tab'. Available tabs: $($tabMap.Keys -join ', ')"
        exit 1
    }
}

if ($Tap -ne "") {
    Write-Host "Tapping coordinates: $Tap on $Device..."
    adb -s $Device shell input tap $Tap
}

if ($Text -ne "") {
    Write-Host "Typing text: $Text on $Device..."
    adb -s $Device shell input text "$Text"
}

if ($Key -ne "") {
    Write-Host "Sending keyevent: $Key on $Device..."
    adb -s $Device shell input keyevent "$Key"
}

if ($Swipe -ne "") {
    Write-Host "Swiping: $Swipe on $Device..."
    adb -s $Device shell input swipe $Swipe
}

if ($DelayMs -gt 0) {
    Start-Sleep -Milliseconds $DelayMs
}

if ($Capture -ne "") {
    Write-Host "Capturing screenshot to $Capture..."
    cmd.exe /c "adb -s $Device exec-out screencap -p > `"$Capture`""
    if (Test-Path $Capture) {
        $fileItem = Get-Item $Capture
        Write-Host "Screenshot saved: $($fileItem.FullName) ($($fileItem.Length) bytes)"
    } else {
        Write-Error "Failed to capture screenshot."
    }
}
