# Helper script to fix the Android environment for the current session

$adbPath = "C:\Users\Drow Ninja\AppData\Local\Android\Sdk\platform-tools"
if (Test-Path "$adbPath\adb.exe") {
    $env:PATH = "$adbPath;" + $env:PATH
    Write-Host "Success: Added $adbPath to PATH."
    adb version
} else {
    Write-Error "Could not find adb.exe at $adbPath"
}
