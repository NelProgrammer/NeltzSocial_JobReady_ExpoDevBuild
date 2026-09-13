param (
    [string]$Device = "emulator-5554",
    [string]$OutputFile = "screen.png"
)

# If $Device is "phone", find connected physical device
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

Write-Host "Capturing screenshot from $Device to $OutputFile..."
cmd.exe /c "adb -s $Device exec-out screencap -p > `"$OutputFile`""

if (Test-Path $OutputFile) {
    $fileItem = Get-Item $OutputFile
    Write-Host "Screenshot saved successfully: $($fileItem.FullName) ($($fileItem.Length) bytes)"
} else {
    Write-Error "Failed to capture screenshot."
}
