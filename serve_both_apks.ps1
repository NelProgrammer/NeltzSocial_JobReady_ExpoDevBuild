# PowerShell Script: Serve Both JobReady APKs over Local Wi-Fi
$port = 8088
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "*Wi-Fi*", "*Ethernet*" | Where-Object { $_.IPAddress -match "^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))" } | Select-Object -First 1).IPAddress
if (-not $localIp) { $localIp = "192.168.100.101" }

$onlineApk = Join-Path $PSScriptRoot "apks\JobReady-Online.apk"
$offlineApk = Join-Path $PSScriptRoot "apks\JobReady-Offline.apk"

$downloadUrl = "http://${localIp}:${port}/"
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " JobReady Wi-Fi APK Download Server" -ForegroundColor Cyan
Write-Host " Open this URL in your Samsung phone's browser:" -ForegroundColor Yellow
Write-Host " -> $downloadUrl" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:${port}/")
try {
    $listener.Start()
} catch {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:${port}/")
    $listener.Start()
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    if ($request.Url.AbsolutePath -eq "/download-online") {
        Write-Host "Sending JobReady-Online.apk to phone ($($request.RemoteEndPoint.Address))..." -ForegroundColor Green
        $bytes = [System.IO.File]::ReadAllBytes($onlineApk)
        $response.ContentType = "application/vnd.android.package-archive"
        $response.AddHeader("Content-Disposition", "attachment; filename=JobReady-Online.apk")
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.OutputStream.Close()
        Write-Host "Online APK sent!" -ForegroundColor Green
    } elseif ($request.Url.AbsolutePath -eq "/download-offline") {
        Write-Host "Sending JobReady-Offline.apk to phone ($($request.RemoteEndPoint.Address))..." -ForegroundColor Green
        $bytes = [System.IO.File]::ReadAllBytes($offlineApk)
        $response.ContentType = "application/vnd.android.package-archive"
        $response.AddHeader("Content-Disposition", "attachment; filename=JobReady-Offline.apk")
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.OutputStream.Close()
        Write-Host "Offline APK sent!" -ForegroundColor Green
    } else {
        $html = @"
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install JobReady Apps</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 30px 16px; margin: 0; }
        .container { max-width: 440px; margin: 0 auto; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); text-align: left; }
        h1 { font-size: 22px; color: #38bdf8; margin-bottom: 6px; text-align: center; }
        .subtitle { font-size: 13px; color: #94a3b8; margin-bottom: 24px; text-align: center; }
        .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; margin-bottom: 8px; }
        .badge-online { background: #0284c7; color: #fff; }
        .badge-offline { background: #16a34a; color: #fff; }
        .app-title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
        .app-pkg { font-size: 12px; color: #64748b; font-family: monospace; margin-bottom: 14px; }
        .btn { display: block; width: 100%; box-sizing: border-box; text-align: center; font-weight: 700; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-size: 15px; }
        .btn-online { background: #0284c7; color: #fff; }
        .btn-offline { background: #16a34a; color: #fff; }
        .footer { font-size: 12px; color: #64748b; margin-top: 20px; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Install JobReady Apps</h1>
        <div class="subtitle">Side-by-side installation on your Samsung phone</div>

        <div class="card">
            <span class="badge badge-online">Online Version</span>
            <div class="app-title">NeltzSocial - JobReady</div>
            <div class="app-pkg">com.neltzsocial.jobready</div>
            <a class="btn btn-online" href="/download-online">Download & Install Online App</a>
        </div>

        <div class="card">
            <span class="badge badge-offline">Offline Version</span>
            <div class="app-title">JobReady Offline</div>
            <div class="app-pkg">com.neltzsocial.jobready.offline</div>
            <a class="btn btn-offline" href="/download-offline">Download & Install Offline App</a>
        </div>

        <div class="footer">
            Both apps have distinct Application IDs and will install as separate apps without overwriting each other.
        </div>
    </div>
</body>
</html>
"@
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
        $response.ContentType = "text/html"
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    }
}
