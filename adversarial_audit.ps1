$BASE = "http://127.0.0.1:8080"
$RUN = Get-Date -Format "MMddHHmmss"

function Out-Log($msg) {
    [Console]::WriteLine($msg)
}

Out-Log "=== SmartTaskPro Adversarial Production Audit Suite ==="
Out-Log "Run ID: $RUN`n"

$script:Total = 0
$script:Passed = 0
$script:Failed = 0
$script:Findings = @()

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
        if ($null -ne $Body) { 
            $jsonStr = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 5 -Compress }
            $p["Body"] = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
        }
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
        Out-Log "  [FAIL] $Id | $Desc (Exp: $expStr, Got: $code, Body: $bodyStr)"
    }
    return @{ Code = $code; Body = $bodyStr; Success = $ok }
}

# --- SETUP USERS & TOKENS ---
$uA = "userA_$RUN"; $eA = "userA_$RUN@test.com"; $pA = "Password123!"
$uB = "userB_$RUN"; $eB = "userB_$RUN@test.com"; $pB = "Password123!"

Test-Api "SETUP-01" "Register User A" "POST" "$BASE/api/v1/auth/register" @{username=$uA;email=$eA;password=$pA} @(200,201) $null | Out-Null
Test-Api "SETUP-02" "Register User B" "POST" "$BASE/api/v1/auth/register" @{username=$uB;email=$eB;password=$pB} @(200,201) $null | Out-Null

$resA = Test-Api "SETUP-03" "Login User A" "POST" "$BASE/api/v1/auth/login" @{username=$uA;password=$pA} @(200) $null
$resB = Test-Api "SETUP-04" "Login User B" "POST" "$BASE/api/v1/auth/login" @{username=$uB;password=$pB} @(200) $null

$tokenA = ($resA.Body | ConvertFrom-Json).token
$tokenB = ($resB.Body | ConvertFrom-Json).token

# --- 1. PROJECT AUTHORIZATION & IDOR ---
Out-Log "`n--- TEST SET 1: PROJECT AUTHORIZATION & IDOR ---"
$projA = Test-Api "PROJ-AUTH-01" "User A creates Project A" "POST" "$BASE/api/v1/projects" @{name="Project A";description="User A private project"} @(200,201) $tokenA
$projAId = ($projA.Body | ConvertFrom-Json).id

# Can User B GET Project A?
$pGetB = Test-Api "PROJ-AUTH-02" "User B GET Project A by ID (Should be 403 Forbidden)" "GET" "$BASE/api/v1/projects/$projAId" $null @(403) $tokenB
if ($pGetB.Code -eq 200) { $script:Findings += "CRITICAL | Project IDOR | GET /projects/{id} allows any authenticated user to view private projects of other users (Got HTTP 200)" }

# Does GET /projects leak Project A to User B in list?
$pListB = Test-Api "PROJ-AUTH-03" "User B GET all projects list" "GET" "$BASE/api/v1/projects" $null @(200) $tokenB
$pListObjs = $pListB.Body | ConvertFrom-Json
if ($pListObjs | Where-Object { $_.name -eq "Project A" }) { $script:Findings += "CRITICAL | Project IDOR | GET /projects returns all projects in system regardless of owner (Data Leakage)" }

# Can User B PUT Project A?
$pPutB = Test-Api "PROJ-AUTH-04" "User B PUT Project A (Should be 403 Forbidden)" "PUT" "$BASE/api/v1/projects/$projAId" @{name="Hacked Project A"} @(403) $tokenB
if ($pPutB.Code -eq 200) { $script:Findings += "CRITICAL | Project IDOR | User B can modify User A's project" }

# Can User B Create Task in Project A?
$tInProjA = Test-Api "PROJ-AUTH-05" "User B creates Task inside Project A (Should be 403 Forbidden)" "POST" "$BASE/api/v1/tasks" @{title="Illegal Task";projectId=$projAId} @(403) $tokenB
if ($tInProjA.Code -in @(200,201)) { $script:Findings += "HIGH | Project Authorization | User B can inject tasks into User A's project" }

# Can User B DELETE Project A?
$pDelB = Test-Api "PROJ-AUTH-06" "User B DELETE Project A (Should be 403 Forbidden)" "DELETE" "$BASE/api/v1/projects/$projAId" $null @(403) $tokenB
if ($pDelB.Code -in @(200,204)) { $script:Findings += "CRITICAL | Project IDOR | User B can delete User A's project" }

# --- 2. TASK IDOR & SUBTASK AUTHORIZATION ---
Out-Log "`n--- TEST SET 2: TASK & SUBTASK IDOR ---"
$taskA = Test-Api "TASK-AUTH-01" "User A creates Task A" "POST" "$BASE/api/v1/tasks" @{title="Task A Confidential";description="Secret details"} @(200,201) $tokenA
$taskAId = ($taskA.Body | ConvertFrom-Json).id

$subA = Test-Api "TASK-AUTH-02" "User A creates Subtask A" "POST" "$BASE/api/v1/tasks/$taskAId/subtasks" @{title="Subtask A Confidential"} @(200,201) $tokenA
$subAId = ($subA.Body | ConvertFrom-Json).id

# Can User B GET Task A?
$tGetB = Test-Api "TASK-AUTH-03" "User B GET Task A by ID (Should be 403 Forbidden)" "GET" "$BASE/api/v1/tasks/$taskAId" $null @(403) $tokenB
if ($tGetB.Code -eq 200) { $script:Findings += "HIGH | Task IDOR | GET /tasks/{id} returns private tasks of other users without checking ownership" }

# Does GET /tasks leak Task A to User B in list?
$tListB = Test-Api "TASK-AUTH-04" "User B GET all tasks list" "GET" "$BASE/api/v1/tasks" $null @(200) $tokenB
$tListObjs = $tListB.Body | ConvertFrom-Json
if ($tListObjs | Where-Object { $_.title -eq "Task A Confidential" }) { $script:Findings += "HIGH | Task Data Leakage | GET /tasks returns all system tasks to any user" }

# Can User B GET Subtasks of Task A?
$stGetB = Test-Api "SUB-AUTH-01" "User B GET Subtasks of Task A (Should be 403 Forbidden)" "GET" "$BASE/api/v1/tasks/$taskAId/subtasks" $null @(403) $tokenB
if ($stGetB.Code -eq 200) { $script:Findings += "HIGH | Subtask IDOR | GET /tasks/{taskId}/subtasks returns subtasks of another user's task" }

# Can User B Toggle Subtask A?
$stTogB = Test-Api "SUB-AUTH-02" "User B Toggle Subtask A (Should be 403 Forbidden)" "PUT" "$BASE/api/v1/tasks/$taskAId/subtasks/$subAId/toggle" $null @(403) $tokenB
if ($stTogB.Code -eq 200) { $script:Findings += "HIGH | Subtask IDOR | User B can toggle completion of User A's subtask" }

# Can User B Update Subtask A?
$stPutB = Test-Api "SUB-AUTH-03" "User B Update Subtask A (Should be 403 Forbidden)" "PUT" "$BASE/api/v1/tasks/$taskAId/subtasks/$subAId" @{title="Hacked Subtask"} @(403) $tokenB

# Can User B Delete Subtask A?
$stDelB = Test-Api "SUB-AUTH-04" "User B Delete Subtask A (Should be 403 Forbidden)" "DELETE" "$BASE/api/v1/tasks/$taskAId/subtasks/$subAId" $null @(403) $tokenB

# Subtask mismatch check: Toggle Subtask A with WRONG task ID
$taskB = Test-Api "TASK-AUTH-05" "User B creates Task B" "POST" "$BASE/api/v1/tasks" @{title="Task B"} @(200,201) $tokenB
$taskBId = ($taskB.Body | ConvertFrom-Json).id

$mismatchTog = Test-Api "SUB-AUTH-05" "User A toggle Subtask A passing Task B's ID (Should be 404 / 400)" "PUT" "$BASE/api/v1/tasks/$taskBId/subtasks/$subAId/toggle" $null @(400,404,403) $tokenA
if ($mismatchTog.Code -eq 200) { $script:Findings += "MEDIUM | Integrity Vulnerability | Subtask toggling allowed with mismatched taskId" }

# --- 3. INPUT VALIDATION & FUZZING ---
Out-Log "`n--- TEST SET 3: INPUT VALIDATION & EDGE CASES ---"
Test-Api "VAL-01" "SQL Injection payload in task title" "POST" "$BASE/api/v1/tasks" @{title="' OR '1'='1' --";description="SQLi"} @(200,201,400) $tokenA | Out-Null
Test-Api "VAL-02" "XSS payload in task description" "POST" "$BASE/api/v1/tasks" @{title="XSS Test";description="<script>alert(1)</script>"} @(200,201,400) $tokenA | Out-Null
Test-Api "VAL-03" "Unicode & Emojis in project name" "POST" "$BASE/api/v1/projects" @{name="🚀 Proj Unicode 測試 🌟";description="Emoji test"} @(200,201) $tokenA | Out-Null
Test-Api "VAL-04" "Negative estimatedHours" "POST" "$BASE/api/v1/tasks" @{title="Neg Hours";estimatedHours=-50} @(400) $tokenA | Out-Null
Test-Api "VAL-05" "Oversized string payload (10,000 chars)" "POST" "$BASE/api/v1/tasks" @{title=("A"*10000);description="Oversized"} @(400) $tokenA | Out-Null

# --- 4. JWT SECURITY & MALFORMED TOKENS ---
Out-Log "`n--- TEST SET 4: JWT & AUTHENTICATION EDGE CASES ---"
Test-Api "JWT-01" "Empty Authorization Header" "GET" "$BASE/api/v1/tasks" $null @(401,403) "" | Out-Null
Test-Api "JWT-02" "Garbage Bearer Token" "GET" "$BASE/api/v1/tasks" $null @(401,403) "Bearer completely.fake.token" | Out-Null
Test-Api "JWT-03" "None Algorithm JWT attack attempt" "GET" "$BASE/api/v1/tasks" $null @(401,403) "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiJ9." | Out-Null

# --- 5. CASCADE DELETION INTEGRITY ---
Out-Log "`n--- TEST SET 5: CASCADE DELETION INTEGRITY ---"
$pCascade = Test-Api "CAS-01" "Create Project for Cascade Delete Test" "POST" "$BASE/api/v1/projects" @{name="Cascade Proj"} @(200,201) $tokenA
$pCasId = ($pCascade.Body | ConvertFrom-Json).id

$tCascade = Test-Api "CAS-02" "Create Task in Cascade Proj" "POST" "$BASE/api/v1/tasks" @{title="Cascade Task";projectId=$pCasId} @(200,201) $tokenA
$tCasId = ($tCascade.Body | ConvertFrom-Json).id

$stCascade = Test-Api "CAS-03" "Create Subtask in Cascade Task" "POST" "$BASE/api/v1/tasks/$tCasId/subtasks" @{title="Cascade Subtask"} @(200,201) $tokenA
$stCasId = ($stCascade.Body | ConvertFrom-Json).id

# Now Delete Project
$delCasP = Test-Api "CAS-04" "Delete Project" "DELETE" "$BASE/api/v1/projects/$pCasId" $null @(200,204) $tokenA

if ($delCasP.Success) {
    # Check if task is gone or orphaned
    $chkTask = Test-Api "CAS-05" "Verify Task is deleted or un-queriable (404)" "GET" "$BASE/api/v1/tasks/$tCasId" $null @(404) $tokenA
    if ($chkTask.Code -eq 200) { $script:Findings += "HIGH | Database Integrity | Deleting a Project leaves orphaned Tasks in database" }
}

Out-Log "`n======================================="
Out-Log "     ADVERSARIAL AUDIT SUMMARY"
Out-Log "======================================="
Out-Log "Total Tests Run : $script:Total"
Out-Log "Passed          : $script:Passed"
Out-Log "Failed          : $script:Failed"
Out-Log "`nDiscovered Vulnerabilities & Deficiencies ($($script:Findings.Count)):"
if ($script:Findings.Count -eq 0) {
    Out-Log "  None!"
} else {
    foreach ($f in $script:Findings) { Out-Log "  [!] $f" }
}
Out-Log "======================================="
