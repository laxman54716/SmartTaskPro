$BASE = "http://127.0.0.1:8080"
$RUN = Get-Date -Format "MMddHHmmss"

function Out-Log($msg) {
    [Console]::WriteLine($msg)
}

Out-Log "=== SmartTaskPro Instant E2E Audit Suite ==="
Out-Log "Run ID: $RUN"

$script:Total = 0
$script:Passed = 0
$script:Failed = 0
$script:Bugs = @()

function Test-Api {
    param($Id, $Desc, $Method, $Url, $Body, $Expected, $Token)
    $script:Total++
    $h = @{"Content-Type" = "application/json"}
    if ($Token) { $h["Authorization"] = "Bearer $Token" }

    $code = 0
    $bodyStr = ""
    try {
        $p = @{
            Uri = $Url
            Method = $Method
            Headers = $h
            UseBasicParsing = $true
            ErrorAction = "Stop"
            TimeoutSec = 10
        }
        if ($Body) { $p["Body"] = ($Body | ConvertTo-Json -Depth 5 -Compress) }
        $resp = Invoke-WebRequest @p
        $code = [int]$resp.StatusCode
        $bodyStr = $resp.Content
    }
    catch {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            try {
                $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $bodyStr = $sr.ReadToEnd()
            } catch {}
        } else {
            $code = 0
            $bodyStr = $_.Exception.Message
        }
    }

    $ok = $Expected -contains $code
    if ($ok) {
        $script:Passed++
        Out-Log "  [PASS] $Id | $Desc (Got: $code)"
    } else {
        $script:Failed++
        $expStr = $Expected -join "/"
        Out-Log "  [FAIL] $Id | $Desc (Exp: $expStr, Got: $code)"
    }
    return @{ Code = $code; Body = $bodyStr; Success = $ok }
}

# --- PHASE 1: REGISTRATION ---
Out-Log "`n--- PHASE 1: REGISTRATION ---"
$u = "usr_$RUN"; $e = "usr_$RUN@test.com"
$m = "mgr_$RUN"; $me = "mgr_$RUN@test.com"

$r1 = Test-Api "REG-001" "Valid User Registration" "POST" "$BASE/api/v1/auth/register" @{username=$u;email=$e;password="Password123!"} @(200,201) $null
$r2 = Test-Api "REG-002" "Register Manager" "POST" "$BASE/api/v1/auth/register" @{username=$m;email=$me;password="ManagerPass123!"} @(200,201) $null
$r3 = Test-Api "REG-003" "Duplicate Username Rejected" "POST" "$BASE/api/v1/auth/register" @{username=$u;email="diff_$RUN@test.com";password="Password123!"} @(400,409) $null
if (-not $r3.Success) { $script:Bugs += "BUG-001 [HIGH] Duplicate username returned HTTP $($r3.Code) instead of 400/409" }

$r4 = Test-Api "REG-004" "Empty Username Rejected" "POST" "$BASE/api/v1/auth/register" @{username="";email="e_$RUN@test.com";password="Password123!"} @(400) $null
if (-not $r4.Success) { $script:Bugs += "BUG-002 [HIGH] Empty username accepted (Got: $($r4.Code))" }

$r5 = Test-Api "REG-005" "Invalid Email Rejected" "POST" "$BASE/api/v1/auth/register" @{username="inv_$RUN";email="notanemail";password="Password123!"} @(400) $null
if (-not $r5.Success) { $script:Bugs += "BUG-003 [HIGH] Invalid email accepted (Got: $($r5.Code))" }

$r6 = Test-Api "REG-006" "Weak Password Rejected (<8 chars)" "POST" "$BASE/api/v1/auth/register" @{username="weak_$RUN";email="w_$RUN@test.com";password="1"} @(400) $null
if (-not $r6.Success) { $script:Bugs += "BUG-004 [HIGH] 1-char password accepted without min-length validation (Got: $($r6.Code))" }

# --- PHASE 2: LOGIN ---
Out-Log "`n--- PHASE 2: LOGIN ---"
$uJwt = $null; $mJwt = $null
$l1 = Test-Api "AUTH-001" "Valid User Login" "POST" "$BASE/api/v1/auth/login" @{username=$u;password="Password123!"} @(200) $null
if ($l1.Success) { try { $uJwt = ($l1.Body | ConvertFrom-Json).token } catch {} }

$l2 = Test-Api "AUTH-002" "Valid Manager Login" "POST" "$BASE/api/v1/auth/login" @{username=$m;password="ManagerPass123!"} @(200) $null
if ($l2.Success) { try { $mJwt = ($l2.Body | ConvertFrom-Json).token } catch {} }

$l3 = Test-Api "AUTH-003" "Wrong Password Rejected" "POST" "$BASE/api/v1/auth/login" @{username=$u;password="WrongPass!"} @(401,403) $null

# --- PHASE 3: PROJECTS ---
Out-Log "`n--- PHASE 3: PROJECTS ---"
$projId = $null
if ($uJwt) {
    $p1 = Test-Api "PROJ-001" "Create Project" "POST" "$BASE/api/v1/projects" @{name="Project Alpha";description="Main testing project"} @(200,201) $uJwt
    if ($p1.Success) { try { $projId = ($p1.Body | ConvertFrom-Json).id } catch {} }
    $p2 = Test-Api "PROJ-002" "Get Projects" "GET" "$BASE/api/v1/projects" $null @(200) $uJwt
    if ($projId) {
        $p3 = Test-Api "PROJ-003" "Get Project By ID" "GET" "$BASE/api/v1/projects/$projId" $null @(200) $uJwt
        $p4 = Test-Api "PROJ-004" "Update Project" "PUT" "$BASE/api/v1/projects/$projId" @{name="Project Alpha Updated";description="Updated"} @(200) $uJwt
    }
}

# --- PHASE 4: TASKS, SUBTASKS & IDOR ---
Out-Log "`n--- PHASE 4: TASKS, SUBTASKS & IDOR ---"
$t1 = Test-Api "TASK-001" "Unauthenticated Access Rejected" "GET" "$BASE/api/v1/tasks" $null @(401,403) $null
if ($t1.Code -eq 200) { $script:Bugs += "BUG-007 [CRITICAL] Protected task endpoints accessible without JWT token!" }

if ($uJwt) {
    $t2 = Test-Api "TASK-002" "Get Tasks (Authenticated)" "GET" "$BASE/api/v1/tasks" $null @(200) $uJwt

    $targetProj = if ($projId) { $projId } else { 1 }
    $taskBody = @{ title="Audit Task $RUN"; description="QA Task"; priority="HIGH"; status="TODO"; projectId=$targetProj }
    $t3 = Test-Api "TASK-003" "Create Task" "POST" "$BASE/api/v1/tasks" $taskBody @(200,201) $uJwt
    $taskId = $null
    if ($t3.Success) { try { $taskId = ($t3.Body | ConvertFrom-Json).id } catch {} }
    else { $script:Bugs += "BUG-008 [CRITICAL] Task creation failed (Got: $($t3.Code), Body: $($t3.Body))" }

    $t4 = Test-Api "TASK-004" "Empty Title Rejected" "POST" "$BASE/api/v1/tasks" @{title="";description="x";projectId=$targetProj} @(400) $uJwt

    if ($taskId) {
        $t5 = Test-Api "TASK-005" "Get Task By ID" "GET" "$BASE/api/v1/tasks/$taskId" $null @(200) $uJwt
        $t6 = Test-Api "TASK-006" "Update Task by Owner" "PUT" "$BASE/api/v1/tasks/$taskId" @{title="Updated $RUN";description="Upd";projectId=$targetProj} @(200) $uJwt

        # Subtasks
        $st1 = Test-Api "SUB-001" "Create Subtask" "POST" "$BASE/api/v1/tasks/$taskId/subtasks" @{title="Subtask 1";done=$false} @(200,201) $uJwt
        $subId = $null
        if ($st1.Success) { try { $subId = ($st1.Body | ConvertFrom-Json).id } catch {} }

        if ($subId) {
            $st2 = Test-Api "SUB-002" "Get Subtasks" "GET" "$BASE/api/v1/tasks/$taskId/subtasks" $null @(200) $uJwt
            $st3 = Test-Api "SUB-003" "Toggle Subtask" "PUT" "$BASE/api/v1/tasks/$taskId/subtasks/$subId/toggle" $null @(200) $uJwt
            $st4 = Test-Api "SUB-004" "Delete Subtask" "DELETE" "$BASE/api/v1/tasks/$taskId/subtasks/$subId" $null @(200,204) $uJwt
        }

        if ($mJwt) {
            $t7 = Test-Api "TASK-007" "IDOR: Manager Update Other User Task" "PUT" "$BASE/api/v1/tasks/$taskId" @{title="Hacked";projectId=$targetProj} @(403) $mJwt
            if ($t7.Code -eq 400) { $script:Bugs += "BUG-010 [MEDIUM] IDOR update rejection returned HTTP 400 instead of HTTP 403 Forbidden" }
            elseif ($t7.Code -eq 200) { $script:Bugs += "BUG-011 [CRITICAL] IDOR Security Vulnerability: Manager modified another user's task!" }

            $t8 = Test-Api "TASK-008" "IDOR: Manager Delete Other User Task" "DELETE" "$BASE/api/v1/tasks/$taskId" $null @(403) $mJwt
            if ($t8.Code -eq 400) { $script:Bugs += "BUG-012 [MEDIUM] IDOR delete rejection returned HTTP 400 instead of HTTP 403 Forbidden" }
            elseif ($t8.Code -eq 200 -or $t8.Code -eq 204) { $script:Bugs += "BUG-013 [CRITICAL] IDOR Security Vulnerability: Manager deleted another user's task!" }
        }

        $t9 = Test-Api "TASK-009" "Delete Task by Owner" "DELETE" "$BASE/api/v1/tasks/$taskId" $null @(200,204) $uJwt
        $t10 = Test-Api "TASK-010" "Get Deleted Task Returns 404" "GET" "$BASE/api/v1/tasks/$taskId" $null @(404) $uJwt
        if ($t10.Code -eq 400) { $script:Bugs += "BUG-015 [MEDIUM] Deleted task query returned HTTP 400 instead of HTTP 404 Not Found" }
    }
}

# --- PHASE 5: SECURITY & RATE LIMITING ---
Out-Log "`n--- PHASE 5: SECURITY & RATE LIMITING ---"
$s1 = Test-Api "SEC-001" "Malformed JWT Rejected" "GET" "$BASE/api/v1/tasks" $null @(401,403) "bad.jwt.token"
if ($s1.Code -eq 500) { $script:Bugs += "BUG-016 [HIGH] Malformed JWT header causes HTTP 500 server crash" }

$s2 = Test-Api "SEC-002" "Swagger UI Endpoint" "GET" "$BASE/swagger-ui.html" $null @(200,302) $null

# Rapid requests
Out-Log "  [TEST] SEC-003 | Testing Rate Limiting (55 rapid requests)..."
$rl = $false
for ($i = 1; $i -le 55; $i++) {
    try {
        $rr = Invoke-WebRequest -Uri "$BASE/api/v1/tasks" -Method GET -Headers @{"Authorization"="Bearer bad"} -UseBasicParsing -ErrorAction SilentlyContinue -TimeoutSec 2
        if ($rr.StatusCode -eq 429) { $rl = $true; break }
    } catch {
        if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 429) { $rl = $true; break }
    }
}
$script:Total++
if ($rl) { $script:Passed++; Out-Log "  [PASS] SEC-003 | Rate Limiting Triggered (429)" }
else { $script:Failed++; Out-Log "  [FAIL] SEC-003 | Rate Limiting NOT Triggered (Expected 429)" }

# --- PHASE 6: LOGOUT ---
Out-Log "`n--- PHASE 6: LOGOUT & TOKEN BLACKLIST ---"
if ($uJwt) {
    $lo = Test-Api "LOG-001" "Logout Endpoint" "POST" "$BASE/api/v1/auth/logout" $null @(200,204) $uJwt
    Start-Sleep -Seconds 1
    $postLo = Test-Api "LOG-002" "Post-Logout Access Rejected" "GET" "$BASE/api/v1/tasks" $null @(401,403) $uJwt
    if ($postLo.Code -eq 200) { $script:Bugs += "BUG-018 [CRITICAL] Logged out blacklisted JWT still grants access!" }
}

Out-Log "`n======================================="
Out-Log "       FINAL AUDIT EXECUTION RESULTS"
Out-Log "======================================="
Out-Log "Total Executed Tests : $script:Total"
Out-Log "Passed               : $script:Passed"
Out-Log "Failed               : $script:Failed"
$rate = if ($script:Total -gt 0) { [Math]::Round(($script:Passed / $script:Total) * 100, 1) } else { 0 }
Out-Log "Pass Rate            : $rate%"
Out-Log "`nDiscovered Bugs ($($script:Bugs.Count)):"
if ($script:Bugs.Count -eq 0) {
    Out-Log "  None! All audit requirements passed."
} else {
    foreach ($b in $script:Bugs) { Out-Log "  - $b" }
}
Out-Log "======================================="
