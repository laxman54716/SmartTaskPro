$BASE = "http://localhost:8080"
$RUN = Get-Date -Format "MMddHHmmss"

function Out-Log($msg) {
    [Console]::WriteLine($msg)
}

Out-Log "=== SmartTaskPro Complete E2E Audit Test Suite ==="
Out-Log "Run Identifier: $RUN"
Out-Log ""

$script:Total = 0
$script:Passed = 0
$script:Failed = 0
$script:Bugs = @()

function Test-Endpoint {
    param(
        [string]$Id,
        [string]$Description,
        [string]$Method,
        [string]$Url,
        $Body,
        [int[]]$ExpectedCodes,
        [string]$AuthToken
    )
    $script:Total++
    $headers = @{"Content-Type" = "application/json"}
    if ($AuthToken) {
        $headers["Authorization"] = "Bearer $AuthToken"
    }

    $statusCode = 0
    $responseBody = ""

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            ErrorAction = "Stop"
            TimeoutSec = 10
        }
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 5 -Compress)
        }
        $resp = Invoke-WebRequest @params
        $statusCode = [int]$resp.StatusCode
        $responseBody = $resp.Content
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $responseBody = $reader.ReadToEnd()
            } catch {}
        } else {
            $statusCode = 0
            $responseBody = $_.Exception.Message
        }
    }

    $isOk = $ExpectedCodes -contains $statusCode
    if ($isOk) {
        $script:Passed++
        Out-Log "  [PASS] $Id | $Description (Got: $statusCode)"
    } else {
        $script:Failed++
        $expStr = $ExpectedCodes -join "/"
        Out-Log "  [FAIL] $Id | $Description (Expected: $expStr, Got: $statusCode)"
    }

    return @{ Code = $statusCode; Body = $responseBody; Success = $isOk }
}

# --- PHASE 1: REGISTRATION ---
Out-Log "--- PHASE 1: USER REGISTRATION TESTING ---"
$user = "user_$RUN"
$email = "user_$RUN@test.com"
$mgr = "mgr_$RUN"
$mgremail = "mgr_$RUN@test.com"

$res1 = Test-Endpoint "REG-001" "Valid User Registration" "POST" "$BASE/api/v1/auth/register" @{username=$user;email=$email;password="Password123!"} @(200,201) $null
$res2 = Test-Endpoint "REG-002" "Register Manager" "POST" "$BASE/api/v1/auth/register" @{username=$mgr;email=$mgremail;password="ManagerPass123!"} @(200,201) $null
$res3 = Test-Endpoint "REG-003" "Duplicate Username Rejected" "POST" "$BASE/api/v1/auth/register" @{username=$user;email="other_$RUN@test.com";password="Password123!"} @(400,409) $null
if (-not $res3.Success) { $script:Bugs += "BUG-001 [HIGH] Duplicate username returns $($res3.Code) instead of 400/409" }

$res4 = Test-Endpoint "REG-004" "Empty Username Rejected" "POST" "$BASE/api/v1/auth/register" @{username="";email="empty_$RUN@test.com";password="Password123!"} @(400) $null
if (-not $res4.Success) { $script:Bugs += "BUG-002 [HIGH] Empty username accepted (Got: $($res4.Code))" }

$res5 = Test-Endpoint "REG-005" "Invalid Email Format Rejected" "POST" "$BASE/api/v1/auth/register" @{username="inv_email_$RUN";email="notanemail";password="Password123!"} @(400) $null
if (-not $res5.Success) { $script:Bugs += "BUG-003 [HIGH] Invalid email accepted (Got: $($res5.Code))" }

$res6 = Test-Endpoint "REG-006" "Weak Password Rejected" "POST" "$BASE/api/v1/auth/register" @{username="weak_$RUN";email="weak_$RUN@test.com";password="1"} @(400) $null
if (-not $res6.Success) { $script:Bugs += "BUG-004 [HIGH] 1-character weak password accepted without validation (Got: $($res6.Code))" }

Out-Log ""

# --- PHASE 2: LOGIN & AUTHENTICATION ---
Out-Log "--- PHASE 2: LOGIN & AUTHENTICATION TESTING ---"
$userJwt = $null
$mgrJwt = $null

$loginUser = Test-Endpoint "AUTH-001" "Valid User Login" "POST" "$BASE/api/v1/auth/login" @{username=$user;password="Password123!"} @(200) $null
if ($loginUser.Success) {
    try { $userJwt = ($loginUser.Body | ConvertFrom-Json).token } catch {}
} else {
    $script:Bugs += "BUG-005 [CRITICAL] Registered valid user failed login (Got: $($loginUser.Code))"
}

$loginMgr = Test-Endpoint "AUTH-002" "Valid Manager Login" "POST" "$BASE/api/v1/auth/login" @{username=$mgr;password="ManagerPass123!"} @(200) $null
if ($loginMgr.Success) {
    try { $mgrJwt = ($loginMgr.Body | ConvertFrom-Json).token } catch {}
}

$res7 = Test-Endpoint "AUTH-003" "Wrong Password Rejected" "POST" "$BASE/api/v1/auth/login" @{username=$user;password="WrongPassword!"} @(400,401,403) $null
if (-not $res7.Success) { $script:Bugs += "BUG-006 [HIGH] Wrong password accepted (Got: $($res7.Code))" }

$res8 = Test-Endpoint "AUTH-004" "Non-existent User Rejected" "POST" "$BASE/api/v1/auth/login" @{username="non_existent_$RUN";password="Password123!"} @(400,401,404) $null

Out-Log ""

# --- PHASE 3: TASK CRUD & AUTHORIZATION ---
Out-Log "--- PHASE 3: TASK CRUD & AUTHORIZATION TESTING ---"

$res9 = Test-Endpoint "TASK-001" "Unauthenticated Task Listing Rejected" "GET" "$BASE/api/v1/tasks" $null @(401,403) $null
if ($res9.Code -eq 200) { $script:Bugs += "BUG-007 [CRITICAL] Tasks endpoint accessible without auth" }

$taskId = $null
if ($userJwt) {
    $res10 = Test-Endpoint "TASK-002" "Get All Tasks (Authenticated User)" "GET" "$BASE/api/v1/tasks" $null @(200) $userJwt

    # Create task
    $taskData = @{
        title = "Audit Task $RUN"
        description = "Task created during QA audit"
        priority = "HIGH"
        status = "TODO"
        category = "Quality Assurance"
        dueDate = "2026-12-31T23:59:59"
        estimatedHours = 4
        projectId = 1
    }
    $createTask = Test-Endpoint "TASK-003" "Create Task (Valid Data)" "POST" "$BASE/api/v1/tasks" $taskData @(200,201) $userJwt
    if ($createTask.Success) {
        try {
            $taskId = ($createTask.Body | ConvertFrom-Json).id
            Out-Log "       Created Task ID: $taskId"
        } catch {}
    } else {
        $script:Bugs += "BUG-008 [CRITICAL] Task creation failed (Got: $($createTask.Code))"
    }

    # Empty title
    $emptyTitleTask = @{
        title = ""
        description = "Invalid task with empty title"
        priority = "LOW"
        status = "BACKLOG"
        projectId = 1
    }
    $res11 = Test-Endpoint "TASK-004" "Empty Task Title Rejected" "POST" "$BASE/api/v1/tasks" $emptyTitleTask @(400) $userJwt
    if (-not $res11.Success) { $script:Bugs += "BUG-009 [HIGH] Task with empty title accepted (Got: $($res11.Code))" }

    if ($taskId) {
        # Read task by ID
        $res12 = Test-Endpoint "TASK-005" "Get Task by ID" "GET" "$BASE/api/v1/tasks/$taskId" $null @(200) $userJwt

        # Update task by owner
        $updateData = @{
            title = "Updated Task Title $RUN"
            description = "Updated description"
            priority = "CRITICAL"
            status = "IN_PROGRESS"
            projectId = 1
        }
        $res13 = Test-Endpoint "TASK-006" "Update Task by Owner" "PUT" "$BASE/api/v1/tasks/$taskId" $updateData @(200) $userJwt

        # IDOR check: Manager attempting to update user's task
        if ($mgrJwt) {
            $idorUpdate = @{ title = "Hacked Title"; description = "IDOR vulnerability test"; projectId = 1 }
            $res14 = Test-Endpoint "TASK-007" "IDOR: Non-Owner Manager Update Rejected" "PUT" "$BASE/api/v1/tasks/$taskId" $idorUpdate @(403) $mgrJwt
            if ($res14.Code -eq 400) {
                $script:Bugs += "BUG-010 [MEDIUM] IDOR forbidden update returns HTTP 400 instead of HTTP 403 Forbidden"
            } elseif ($res14.Code -eq 200) {
                $script:Bugs += "BUG-011 [CRITICAL] IDOR Vulnerability: Manager modified another user's task!"
            }

            # IDOR check: Manager attempting to delete user's task
            $idorDelete = Test-Endpoint "TASK-008" "IDOR: Non-Owner Manager Delete Rejected" "DELETE" "$BASE/api/v1/tasks/$taskId" $null @(403) $mgrJwt
            if ($idorDelete.Code -eq 400) {
                $script:Bugs += "BUG-012 [MEDIUM] IDOR forbidden delete returns HTTP 400 instead of HTTP 403 Forbidden"
            } elseif ($idorDelete.Code -eq 200 -or $idorDelete.Code -eq 204) {
                $script:Bugs += "BUG-013 [CRITICAL] IDOR Vulnerability: Manager deleted another user's task!"
            }
        }

        # Delete task by owner
        $deleteTask = Test-Endpoint "TASK-009" "Delete Task by Owner" "DELETE" "$BASE/api/v1/tasks/$taskId" $null @(200,204) $userJwt
        if (-not $deleteTask.Success) {
            $script:Bugs += "BUG-014 [HIGH] Owner failed to delete own task (Got: $($deleteTask.Code))"
        }

        # Read deleted task
        $res15 = Test-Endpoint "TASK-010" "Read Deleted Task Returns 404" "GET" "$BASE/api/v1/tasks/$taskId" $null @(404) $userJwt
        if ($res15.Code -eq 400) {
            $script:Bugs += "BUG-015 [MEDIUM] Non-existent / deleted task returns HTTP 400 instead of HTTP 404 Not Found"
        }
    }
}

Out-Log ""

# --- PHASE 4: SECURITY & RATE LIMITING ---
Out-Log "--- PHASE 4: SECURITY CONTROLS & RATE LIMITING ---"

$res16 = Test-Endpoint "SEC-001" "Malformed JWT Token Rejected" "GET" "$BASE/api/v1/tasks" $null @(401,403) "invalid.jwt.signature"
if ($res16.Code -eq 500) { $script:Bugs += "BUG-016 [HIGH] Malformed JWT causes 500 Internal Server Error" }

$res17 = Test-Endpoint "SEC-002" "Swagger UI Accessibility Check" "GET" "$BASE/swagger-ui.html" $null @(200,302) $null

# Rate limiting test
Out-Log "  [TEST] SEC-003 | Testing IP Rate Limiting (55 rapid requests)..."
$rateLimited = $false
$rateLimitReqNum = 0
for ($i = 1; $i -le 55; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "$BASE/api/v1/tasks" -Method GET -Headers @{"Authorization"="Bearer badtoken"} -ErrorAction SilentlyContinue -TimeoutSec 3
        if ($r.StatusCode -eq 429) {
            $rateLimited = $true
            $rateLimitReqNum = $i
            break
        }
    } catch {
        if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 429) {
            $rateLimited = $true
            $rateLimitReqNum = $i
            break
        }
    }
}
$script:Total++
if ($rateLimited) {
    $script:Passed++
    Out-Log "  [PASS] SEC-003 | Rate Limiting Triggered (429 Too Many Requests) at request #$rateLimitReqNum"
} else {
    $script:Failed++
    Out-Log "  [FAIL] SEC-003 | Rate Limiting NOT Triggered after 55 requests"
    $script:Bugs += "BUG-017 [HIGH] Rate Limiting filter failed to trigger 429 response"
}

Out-Log ""

# --- PHASE 5: SESSION TERMINATION & TOKEN BLACKLIST ---
Out-Log "--- PHASE 5: SESSION TERMINATION & LOGOUT ---"
if ($userJwt) {
    $logoutRes = Test-Endpoint "LOGOUT-001" "Logout Endpoint (Token Blacklisting)" "POST" "$BASE/api/v1/auth/logout" $null @(200,204) $userJwt
    if ($logoutRes.Success) {
        # Check if blacklisted token is now rejected
        Start-Sleep -Seconds 1
        $postLogoutReq = Test-Endpoint "LOGOUT-002" "Blacklisted Token Access Rejected" "GET" "$BASE/api/v1/tasks" $null @(401,403) $userJwt
        if ($postLogoutReq.Code -eq 200) {
            $script:Bugs += "BUG-018 [CRITICAL] Logged-out blacklisted JWT still grants access to protected endpoints!"
        }
    } else {
        $script:Bugs += "BUG-019 [HIGH] Logout endpoint returned $($logoutRes.Code)"
    }
}

Out-Log ""
Out-Log "======================================="
Out-Log "     SMARTTASKPRO E2E AUDIT SUMMARY    "
Out-Log "======================================="
Out-Log "Total Executed Tests : $script:Total"
Out-Log "Passed               : $script:Passed"
Out-Log "Failed               : $script:Failed"
$passRate = if ($script:Total -gt 0) { [Math]::Round(($script:Passed / $script:Total) * 100, 1) } else { 0 }
Out-Log "Pass Rate            : $passRate%"
Out-Log ""
Out-Log "Discovered Bugs ($($script:Bugs.Count)):"
foreach ($b in $script:Bugs) {
    Out-Log "  - $b"
}
Out-Log "======================================="
