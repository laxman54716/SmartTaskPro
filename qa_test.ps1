$BASE = "http://localhost:8080"
$P = 0; $F = 0; $T = 0
$BUGS = @()

function Run-Test {
    param($id, $desc, $method, $url, $body, $exps, $auth)
    $script:T++
    $h = @{"Content-Type" = "application/json"}
    if ($auth) { $h["Authorization"] = "Bearer $auth" }
    try {
        $params = @{Uri = $url; Method = $method; Headers = $h; ErrorAction = "Stop"}
        if ($body) { $params["Body"] = ($body | ConvertTo-Json -Depth 5) }
        $resp = Invoke-WebRequest @params
        $s = $resp.StatusCode
        $c = $resp.Content
    }
    catch {
        $s = $_.Exception.Response.StatusCode.value__
        if (-not $s) { $s = 0 }
        $c = ""
    }
    $ok = $exps -contains $s
    if ($ok) {
        $script:P++
        Write-Host "  [PASS] $id | $desc (Got: $s)" -ForegroundColor Green
    }
    else {
        $script:F++
        $expsStr = $exps -join "/"
        Write-Host "  [FAIL] $id | $desc (Exp: $expsStr Got: $s)" -ForegroundColor Red
    }
    return @{S = $s; C = $c; OK = $ok}
}

Write-Host ""
Write-Host "=== SmartTaskPro E2E API Test Suite ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "--- PHASE 1: REGISTRATION ---" -ForegroundColor Yellow

$r = Run-Test "REG-001" "Valid user registration" "POST" "$BASE/api/v1/auth/register" @{username="testqa01";email="testqa01@test.com";password="Secure123!";role="ROLE_USER"} @(200,201) $null
$r = Run-Test "REG-002" "Register manager" "POST" "$BASE/api/v1/auth/register" @{username="mgr_qa01";email="mgr01@test.com";password="Manager123!";role="ROLE_MANAGER"} @(200,201) $null
$r = Run-Test "REG-003" "Duplicate username rejected" "POST" "$BASE/api/v1/auth/register" @{username="testqa01";email="other@test.com";password="Other123!"} @(400,409,500) $null
if (-not $r.OK) { $BUGS += "BUG-001 [HIGH] Duplicate username not rejected - Got $($r.S)" }
$r = Run-Test "REG-004" "Empty username rejected" "POST" "$BASE/api/v1/auth/register" @{username="";email="e@test.com";password="Pass123!"} @(400) $null
if (-not $r.OK) { $BUGS += "BUG-002 [HIGH] Empty username accepted - Got $($r.S)" }
$r = Run-Test "REG-005" "Invalid email rejected" "POST" "$BASE/api/v1/auth/register" @{username="emailtest";email="notanemail";password="Pass123!"} @(400) $null
if (-not $r.OK) { $BUGS += "BUG-003 [HIGH] Invalid email format accepted - Got $($r.S)" }
$r = Run-Test "REG-006" "Weak password rejected" "POST" "$BASE/api/v1/auth/register" @{username="weakp";email="weak@test.com";password="123"} @(400) $null
if (-not $r.OK) { $BUGS += "BUG-004 [HIGH] Weak password accepted - Got $($r.S)" }

Write-Host ""
Write-Host "--- PHASE 2: LOGIN ---" -ForegroundColor Yellow

$JWT = $null
$MgrJWT = $null

try {
    $lb = @{username="testqa01";password="Secure123!"} | ConvertTo-Json
    $lresp = Invoke-WebRequest -Uri "$BASE/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $lb -ErrorAction Stop
    $JWT = ($lresp.Content | ConvertFrom-Json).token
    $script:P++; $script:T++
    Write-Host "  [PASS] LOGIN-001 | Valid login (Got: $($lresp.StatusCode)) - JWT acquired" -ForegroundColor Green
}
catch {
    $script:F++; $script:T++
    Write-Host "  [FAIL] LOGIN-001 | Valid login failed: $_" -ForegroundColor Red
    $BUGS += "BUG-007 [CRITICAL] Valid user cannot login"
}

try {
    $lb2 = @{username="mgr_qa01";password="Manager123!"} | ConvertTo-Json
    $lresp2 = Invoke-WebRequest -Uri "$BASE/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $lb2 -ErrorAction Stop
    $MgrJWT = ($lresp2.Content | ConvertFrom-Json).token
    $script:P++; $script:T++
    Write-Host "  [PASS] LOGIN-002 | Manager login (Got: $($lresp2.StatusCode))" -ForegroundColor Green
}
catch {
    $script:F++; $script:T++
    Write-Host "  [FAIL] LOGIN-002 | Manager login failed: $_" -ForegroundColor Red
}

$r = Run-Test "LOGIN-003" "Wrong password returns 401" "POST" "$BASE/api/v1/auth/login" @{username="testqa01";password="WrongPass"} @(401,403) $null
if (-not $r.OK) { $BUGS += "BUG-008 [HIGH] Wrong password not rejected - Got $($r.S)" }
$r = Run-Test "LOGIN-004" "Non-existent user returns 401" "POST" "$BASE/api/v1/auth/login" @{username="ghostuser999";password="anything"} @(401,403,404) $null
$r = Run-Test "LOGIN-005" "Empty credentials rejected" "POST" "$BASE/api/v1/auth/login" @{username="";password=""} @(400,401) $null
if (-not $r.OK) { $BUGS += "BUG-009 [MEDIUM] Empty credentials not rejected - Got $($r.S)" }

Write-Host ""
Write-Host "--- PHASE 3: TASK MANAGEMENT ---" -ForegroundColor Yellow

$r = Run-Test "TASK-001" "No token returns 401" "GET" "$BASE/api/tasks" $null @(401,403) $null
if ($r.S -eq 200) { $BUGS += "BUG-010 [CRITICAL] Tasks accessible without auth!" }

$createdId = $null

if ($JWT) {
    $r = Run-Test "TASK-002" "Get all tasks (authenticated)" "GET" "$BASE/api/tasks" $null @(200) $JWT
    if (-not $r.OK) { $BUGS += "BUG-011 [CRITICAL] Cannot fetch tasks when authenticated" }

    $taskBody = @{title="QA Firefox E2E Task";description="Created during E2E QA";priority="HIGH";status="TODO";category="QA";dueDate="2026-09-01";estimatedHours=3;projectId=1;labels=@("qa","e2e");subtasks=@()}
    $r = Run-Test "TASK-003" "Create valid task" "POST" "$BASE/api/tasks" $taskBody @(200,201) $JWT
    if ($r.OK) {
        $createdId = ($r.C | ConvertFrom-Json).id
        Write-Host "       Task created with ID: $createdId" -ForegroundColor Cyan
    }
    else { $BUGS += "BUG-012 [CRITICAL] Cannot create task - Got $($r.S)" }

    $r = Run-Test "TASK-004" "Empty title rejected" "POST" "$BASE/api/tasks" @{title="";description="x";priority="LOW";status="TODO";projectId=1} @(400) $JWT
    if (-not $r.OK -and $r.S -ne 400) { $BUGS += "BUG-013 [HIGH] Empty task title accepted - Got $($r.S)" }

    if ($createdId) {
        $r = Run-Test "TASK-005" "Get task by ID" "GET" "$BASE/api/tasks/$createdId" $null @(200) $JWT
        $updateBody = @{title="QA Task UPDATED";description="Updated";priority="URGENT";status="IN_PROGRESS";category="QA";dueDate="2026-09-15";estimatedHours=5;projectId=1;labels=@("qa")}
        $r = Run-Test "TASK-006" "Update task (owner)" "PUT" "$BASE/api/tasks/$createdId" $updateBody @(200) $JWT
        if (-not $r.OK) { $BUGS += "BUG-014 [CRITICAL] Owner cannot update own task - Got $($r.S)" }

        if ($MgrJWT) {
            $hackBody = @{title="HACKED";description="IDOR";priority="LOW";status="TODO";projectId=1}
            $r = Run-Test "TASK-007" "IDOR: Manager cannot update other user task" "PUT" "$BASE/api/tasks/$createdId" $hackBody @(403,500) $MgrJWT
            if ($r.S -eq 200) { $BUGS += "BUG-015 [CRITICAL] IDOR - Manager updated other user task!" }
            $r = Run-Test "TASK-008" "IDOR: Manager cannot delete other user task" "DELETE" "$BASE/api/tasks/$createdId" $null @(403,500) $MgrJWT
            if ($r.S -eq 200 -or $r.S -eq 204) { $BUGS += "BUG-016 [CRITICAL] IDOR - Manager deleted other user task!" }
        }

        for ($i = 1; $i -le 5; $i++) {
            $stArr = @("TODO","IN_PROGRESS","IN_REVIEW","DONE")
            $prArr = @("LOW","MEDIUM","HIGH","URGENT")
            $sb = @{title="Search Task $i";description="Filter test $i";priority=$prArr[$i%4];status=$stArr[$i%4];category="Testing";projectId=1}
            try { Invoke-WebRequest -Uri "$BASE/api/tasks" -Method POST -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $JWT"} -Body ($sb | ConvertTo-Json) -ErrorAction SilentlyContinue | Out-Null } catch {}
        }
        Write-Host "  [INFO] 5 additional tasks created for filter testing" -ForegroundColor Cyan

        $r = Run-Test "TASK-009" "Non-existent task returns 404" "GET" "$BASE/api/tasks/999999" $null @(404,500) $JWT
        if ($r.S -ne 404) { $BUGS += "BUG-017 [MEDIUM] Non-existent task returns $($r.S) not 404" }
        $r = Run-Test "TASK-010" "Delete task (owner)" "DELETE" "$BASE/api/tasks/$createdId" $null @(200,204) $JWT
        if (-not $r.OK) { $BUGS += "BUG-018 [CRITICAL] Owner cannot delete own task - Got $($r.S)" }
        $r = Run-Test "TASK-011" "Deleted task returns 404" "GET" "$BASE/api/tasks/$createdId" $null @(404,500) $JWT
        if ($r.S -eq 200) { $BUGS += "BUG-019 [HIGH] Deleted task still accessible!" }
    }
}

Write-Host ""
Write-Host "--- PHASE 4: SECURITY ---" -ForegroundColor Yellow

$r = Run-Test "SEC-001" "No JWT returns 401" "GET" "$BASE/api/tasks" $null @(401,403) $null
$r = Run-Test "SEC-002" "Malformed JWT returns 401 not 500" "GET" "$BASE/api/tasks" $null @(401,403) "bad.jwt.token"
if ($r.S -eq 500) { $BUGS += "BUG-020 [HIGH] Malformed JWT causes 500 server error" }

try {
    $sw = Invoke-WebRequest -Uri "$BASE/swagger-ui.html" -ErrorAction Stop
    $script:F++; $script:T++
    Write-Host "  [FAIL] SEC-003 | Swagger accessible without auth (Got: $($sw.StatusCode))" -ForegroundColor Red
    $BUGS += "BUG-021 [HIGH] Swagger accessible without auth"
}
catch {
    $code = $_.Exception.Response.StatusCode.value__
    $script:P++; $script:T++
    Write-Host "  [PASS] SEC-003 | Swagger protected (Got: $code)" -ForegroundColor Green
}

Write-Host "  [TEST] SEC-004 | Rate limiting (55 rapid requests)..." -ForegroundColor Cyan
$rl = $false; $rlAt = 0
for ($i = 1; $i -le 55; $i++) {
    try {
        $rr = Invoke-WebRequest -Uri "$BASE/api/tasks" -Method GET -Headers @{"Authorization"="Bearer badtoken"} -ErrorAction SilentlyContinue
        if ($rr.StatusCode -eq 429) { $rl = $true; $rlAt = $i; break }
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 429) { $rl = $true; $rlAt = $i; break }
    }
}
$script:T++
if ($rl) {
    $script:P++
    Write-Host "  [PASS] SEC-004 | Rate limiting triggered at request #$rlAt" -ForegroundColor Green
}
else {
    $script:F++
    Write-Host "  [FAIL] SEC-004 | Rate limiting NOT triggered after 55 requests" -ForegroundColor Red
    $BUGS += "BUG-022 [HIGH] Rate limiting not working"
}

Write-Host ""
Write-Host "--- PHASE 5: LOGOUT ---" -ForegroundColor Yellow

if ($JWT) {
    $freshJWT = $null
    try {
        $lb3 = @{username="testqa01";password="Secure123!"} | ConvertTo-Json
        $lr3 = Invoke-WebRequest -Uri "$BASE/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $lb3 -ErrorAction Stop
        $freshJWT = ($lr3.Content | ConvertFrom-Json).token
    }
    catch {}

    if ($freshJWT) {
        $r = Run-Test "LOGOUT-001" "Logout endpoint works" "POST" "$BASE/api/v1/auth/logout" $null @(200,204) $freshJWT
        if (-not $r.OK) { $BUGS += "BUG-023 [HIGH] Logout endpoint failed - Got $($r.S)" }
        Start-Sleep 1
        $r = Run-Test "LOGOUT-002" "Blacklisted token rejected post-logout" "GET" "$BASE/api/tasks" $null @(401,403) $freshJWT
        if ($r.S -eq 200) { $BUGS += "BUG-024 [CRITICAL] Logged-out JWT still grants access!" }
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "         FINAL TEST RESULTS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Total   : $T"
Write-Host "  Passed  : $P" -ForegroundColor Green
Write-Host "  Failed  : $F" -ForegroundColor Red
$rate = if ($T -gt 0) { [Math]::Round(($P / $T) * 100, 1) } else { 0 }
Write-Host "  Pass Rate: $rate%"
Write-Host ""
if ($BUGS.Count -eq 0) {
    Write-Host "  No bugs found!" -ForegroundColor Green
}
else {
    Write-Host "  BUGS FOUND: $($BUGS.Count)" -ForegroundColor Red
    foreach ($b in $BUGS) {
        Write-Host "    $b" -ForegroundColor Yellow
    }
}
Write-Host "=======================================" -ForegroundColor Cyan
