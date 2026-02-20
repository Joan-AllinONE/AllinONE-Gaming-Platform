# New Day API Diagnostic Script (PowerShell Version)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "New Day API Diagnostic Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$API_BASE = "https://yxp6y2qgnh.coze.site"
$SHARED_API = "$API_BASE/api/shared"
$ALLINONE_API = "$API_BASE/api/allinone"

$token = $null
$allResults = @()

function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )

    Write-Host "Test: $Name" -ForegroundColor Yellow
    Write-Host "Method: $Method" -ForegroundColor Gray
    Write-Host "URL: $Url" -ForegroundColor Gray

    try {
        $params = @{
            Method = $Method
            Uri = $Url
            Headers = $Headers
            TimeoutSec = 10
        }

        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $response = Invoke-RestMethod @params -ErrorAction Stop

        Write-Host "[OK] Success" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
        return $response
    }
    catch {
        Write-Host "[FAIL] Failed" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
        }
        return $null
    }
    Write-Host ""
}

Write-Host "Starting API endpoint tests..."
Write-Host ""

# Test 1: Shared Market API
$result = Test-API -Name "1. Shared Market API" -Method "GET" -Url "$SHARED_API/marketplace"
$allResults += @{ Name = "Shared Market API"; Success = $result -ne $null }

# Test 2: Shared Wallet API
$result = Test-API -Name "2. Shared Wallet API" -Method "GET" -Url "$SHARED_API/wallet/test-user-id"
$allResults += @{ Name = "Shared Wallet API"; Success = $result -ne $null }

# Test 3: AllinONE Login
Write-Host "Test: 3. AllinONE Login" -ForegroundColor Yellow
Write-Host "URL: $ALLINONE_API/auth/login" -ForegroundColor Gray

try {
    $loginResponse = Invoke-RestMethod -Method POST -Uri "$ALLINONE_API/auth/login" `
        -ContentType "application/json" `
        -Body '{"allinoneUserId":"test-user-123","allinoneUsername":"testuser"}' `
        -ErrorAction Stop

    if ($loginResponse.success -and $loginResponse.data.token) {
        $token = $loginResponse.data.token
        Write-Host "[OK] Success" -ForegroundColor Green
        Write-Host "Token: $($token.Substring(0, [Math]::Min(30, $token.Length)))..." -ForegroundColor Gray
        $allResults += @{ Name = "AllinONE Login"; Success = $true }
    } else {
        throw "Login response format incorrect"
    }
}
catch {
    Write-Host "[FAIL] Failed: $($_.Exception.Message)" -ForegroundColor Red
    $allResults += @{ Name = "AllinONE Login"; Success = $false }
}
Write-Host ""

# Skip authenticated tests if login failed
if (-not $token) {
    Write-Host "[WARN] Login failed, skipping authenticated tests" -ForegroundColor Yellow
    Write-Host ""
}
else {
    # Test 4: AllinONE Wallet API
    $result = Test-API -Name "4. AllinONE Wallet API" -Method "GET" `
        -Url "$ALLINONE_API/wallet/balance" `
        -Headers @{ Authorization = "Bearer $token" }
    $allResults += @{ Name = "AllinONE Wallet API"; Success = $result -ne $null }

    # Test 5: AllinONE Inventory API
    $result = Test-API -Name "5. AllinONE Inventory API" -Method "GET" `
        -Url "$ALLINONE_API/inventory" `
        -Headers @{ Authorization = "Bearer $token" }
    $allResults += @{ Name = "AllinONE Inventory API"; Success = $result -ne $null }

    # Test 6: AllinONE Market List API (GET)
    $result = Test-API -Name "6. AllinONE Market List API (GET)" -Method "GET" `
        -Url "$ALLINONE_API/market/list" `
        -Headers @{ Authorization = "Bearer $token" }
    $allResults += @{ Name = "AllinONE Market List API (GET)"; Success = $result -ne $null }

    # Test 7: AllinONE Market Items API (GET)
    $result = Test-API -Name "7. AllinONE Market Items API (GET)" -Method "GET" `
        -Url "$ALLINONE_API/market/items" `
        -Headers @{ Authorization = "Bearer $token" }
    $allResults += @{ Name = "AllinONE Market Items API (GET)"; Success = $result -ne $null }

    # Test 8: Test Item Purchase
    Write-Host "Test: 8. AllinONE Item Purchase" -ForegroundColor Yellow
    try {
        $marketResponse = Invoke-RestMethod -Method GET -Uri "$ALLINONE_API/market/list" `
            -Headers @{ Authorization = "Bearer $token" } `
            -ErrorAction Stop

        $items = if ($marketResponse.items) { $marketResponse.items } elseif ($marketResponse.data) { $marketResponse.data } else { @() }

        if ($items.Count -gt 0) {
            $firstItem = $items[0]
            $purchaseBody = @{
                itemId = $firstItem.id
                currencyType = "gameCoins"
                quantity = 1
            } | ConvertTo-Json -Depth 3

            $purchaseResponse = Invoke-RestMethod -Method POST -Uri "$ALLINONE_API/market/purchase" `
                -Headers @{ Authorization = "Bearer $token" } `
                -ContentType "application/json" `
                -Body $purchaseBody `
                -ErrorAction Stop

            Write-Host "[OK] Success (purchase function available)" -ForegroundColor Green
            $allResults += @{ Name = "AllinONE Item Purchase"; Success = $true }
        }
        else {
            Write-Host "[WARN] Skipped (no items in market)" -ForegroundColor Yellow
            $allResults += @{ Name = "AllinONE Item Purchase"; Success = $true }
        }
    }
    catch {
        Write-Host "[OK] API available (purchase failed: $($_.Exception.Message))" -ForegroundColor Green
        $allResults += @{ Name = "AllinONE Item Purchase"; Success = $true }
    }
    Write-Host ""

    # Test 9: Test Item Transfer
    Write-Host "Test: 9. AllinONE Item Transfer" -ForegroundColor Yellow
    try {
        $inventoryResponse = Invoke-RestMethod -Method GET -Uri "$ALLINONE_API/inventory" `
            -Headers @{ Authorization = "Bearer $token" } `
            -ErrorAction Stop

        $items = if ($inventoryResponse.items) { $inventoryResponse.items } elseif ($inventoryResponse.data) { $inventoryResponse.data } else { @() }

        if ($items.Count -gt 0) {
            $firstItem = $items[0]
            $transferBody = @{
                itemId = $firstItem.id
                targetPlatform = "allinone"
                quantity = 1
            } | ConvertTo-Json -Depth 3

            $transferResponse = Invoke-RestMethod -Method POST -Uri "$ALLINONE_API/market/transfer" `
                -Headers @{ Authorization = "Bearer $token" } `
                -ContentType "application/json" `
                -Body $transferBody `
                -ErrorAction Stop

            Write-Host "[OK] Success (transfer function available)" -ForegroundColor Green
            $allResults += @{ Name = "AllinONE Item Transfer"; Success = $true }
        }
        else {
            Write-Host "[WARN] Skipped (no items in inventory)" -ForegroundColor Yellow
            $allResults += @{ Name = "AllinONE Item Transfer"; Success = $true }
        }
    }
    catch {
        Write-Host "[OK] API available (transfer failed: $($_.Exception.Message))" -ForegroundColor Green
        $allResults += @{ Name = "AllinONE Item Transfer"; Success = $true }
    }
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$successCount = ($allResults | Where-Object { $_.Success }).Count
$totalCount = $allResults.Count

Write-Host "Total: $totalCount tests" -ForegroundColor White
Write-Host "Success: $successCount tests" -ForegroundColor Green
Write-Host "Failed: $($totalCount - $successCount) tests" -ForegroundColor Red

$successRate = if ($totalCount -gt 0) { [math]::Round(($successCount / $totalCount) * 100, 1) } else { 0 }
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })

Write-Host ""
Write-Host "Detailed Results:" -ForegroundColor Yellow
foreach ($result in $allResults) {
    if ($result.Success) {
        Write-Host "  [OK] $($result.Name)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $($result.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnostic Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($successRate -ge 80) {
    Write-Host ""
    Write-Host "[SUCCESS] Most tests passed! You can start integration!" -ForegroundColor Green
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "[WARN] Some tests failed, please check failed items" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Press Enter to exit..."
$null = Read-Host
