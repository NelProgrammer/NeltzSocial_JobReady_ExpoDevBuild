$ErrorActionPreference = "Continue"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Starting Android Build..."
npx expo run:android --port 8081 2>&1 | Tee-Object build_log.txt
