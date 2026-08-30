$BASE = "http://localhost:8080"

Write-Host "=== Backend Connectivity Check ===" -ForegroundColor Cyan

# 1. Test register
Write-Host "`n[1] Testing /api/v1/auth/register..." -ForegroundColor Yellow
try {
    $body = '{"username":"pingtest99","email":"ping99@test.com","password":"Secure123!","role":"ROLE_USER"}'
    $r = Invoke-WebRequest -Uri "$BASE/api/v1/auth/register" -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  STATUS : $($r.StatusCode)" -ForegroundColor Green
    Write-Host "  BODY   : $($r.Content)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "  STATUS : $code" -ForegroundColor Red
    Write-Host "  ERROR  : $_"
}

# 2. Test login
Write-Host "`n[2] Testing /api/v1/auth/login..." -ForegroundColor Yellow
try {
    $body2 = '{"username":"pingtest99","password":"Secure123!"}'
    $r2 = Invoke-WebRequest -Uri "$BASE/api/v1/auth/login" -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body2 -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  STATUS : $($r2.StatusCode)" -ForegroundColor Green
    Write-Host "  BODY   : $($r2.Content)"
} catch {
    $code2 = $_.Exception.Response.StatusCode.value__
    Write-Host "  STATUS : $code2" -ForegroundColor Red
    Write-Host "  ERROR  : $_"
}

# 3. Test tasks (no auth)
Write-Host "`n[3] Testing /api/tasks (no auth)..." -ForegroundColor Yellow
try {
    $r3 = Invoke-WebRequest -Uri "$BASE/api/tasks" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  STATUS : $($r3.StatusCode)" -ForegroundColor Green
} catch {
    $code3 = $_.Exception.Response.StatusCode.value__
    Write-Host "  STATUS : $code3 (expected 401/403)" -ForegroundColor Yellow
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
