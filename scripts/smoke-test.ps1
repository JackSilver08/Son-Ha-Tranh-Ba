param([string]$BaseUrl = "http://localhost:8080")
$ErrorActionPreference = "Stop"
Write-Host "Sơn Hà Tranh Bá - Phase 1 Smoke Test" -ForegroundColor Cyan
$checks = @(
    @{ Path = "/api/health"; Key = "status"; Expected = "ok" },
    @{ Path = "/api/health/db"; Key = "status"; Expected = "ok" },
    @{ Path = "/api/simulation/status"; Key = "status"; Expected = "foundation-heartbeat-only" }
)
foreach ($check in $checks) {
    $body = Invoke-RestMethod -Uri "$BaseUrl$($check.Path)" -Method Get -TimeoutSec 15
    if ($body.($check.Key) -ne $check.Expected) {
        throw "FAILED $($check.Path): unexpected result"
    }
    Write-Host "PASS $($check.Path)" -ForegroundColor Green
}
$page = Invoke-WebRequest -Uri $BaseUrl -Method Get -TimeoutSec 15 -UseBasicParsing
if ($page.StatusCode -ne 200 -or $page.Content -notmatch 'Sơn Hà Tranh Bá') {
    throw "FAILED frontend index.html"
}
Write-Host "PASS frontend index.html" -ForegroundColor Green
Write-Host "API / DB / Frontend HTTP OK. Confirm SignalR and PixiJS visually at $BaseUrl" -ForegroundColor Yellow
