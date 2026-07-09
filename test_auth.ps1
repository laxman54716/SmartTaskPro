$body = '{"username":"directtest1","email":"direct1@test.com","password":"Secure123!","role":"ROLE_USER"}'
$headers = @{"Content-Type" = "application/json"}

Write-Host "Test 1: Without Origin header"
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/register" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "  Status: $($r.StatusCode)"
    Write-Host "  Body: $($r.Content)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "  Error Status: $code"
    Write-Host "  Error: $_"
}

Write-Host ""
Write-Host "Test 2: With Origin header"
$headers2 = @{"Content-Type" = "application/json"; "Origin" = "http://localhost:4200"}
$body2 = '{"username":"directtest2","email":"direct2@test.com","password":"Secure123!","role":"ROLE_USER"}'
try {
    $r2 = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/register" -Method POST -Headers $headers2 -Body $body2 -ErrorAction Stop
    Write-Host "  Status: $($r2.StatusCode)"
    Write-Host "  Body: $($r2.Content)"
} catch {
    $code2 = $_.Exception.Response.StatusCode.value__
    Write-Host "  Error Status: $code2"
    Write-Host "  Error: $_"
}
