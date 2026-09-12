@echo off
setlocal
echo ==========================================================
echo  JobReady - Wi-Fi APK Download Server for Samsung Phone
echo ==========================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve_both_apks.ps1"

pause
