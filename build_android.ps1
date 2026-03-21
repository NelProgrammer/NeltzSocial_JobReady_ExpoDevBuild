$ErrorActionPreference = "Continue"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Java Path:"
Get-Command java

Write-Host "Stopping Gradle Daemon..."
cd android
.\gradlew --stop

Write-Host "Assembling Debug Build..."
.\gradlew assembleDebug --info
