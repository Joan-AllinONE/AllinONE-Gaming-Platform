# New Day API 诊断脚本 (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  New Day API 诊断工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "https://yxp6y2qgnh.coze.site"

# 诊断 1: 基础连接
Write-Host "[诊断 1] 测试基础连接..." -ForegroundColor Yellow
Write-Host "请求: $BASE_URL"
try {
    $response = Invoke-WebRequest -Uri $BASE_URL -Method Head -UseBasicParsing
    Write-Host "✅ 状态码: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 诊断 2: /api 路径
Write-Host "[诊断 2] 测试 /api 路径..." -ForegroundColor Yellow
Write-Host "请求: $BASE_URL/api"
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api" -Method Head -UseBasicParsing
    Write-Host "✅ 状态码: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 诊断 3: /api/shared/marketplace
Write-Host "[诊断 3] 测试 /api/shared/marketplace..." -ForegroundColor Yellow
Write-Host "请求: $BASE_URL/api/shared/marketplace"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/shared/marketplace?gameSource=New+Day" -Method Get -UseBasicParsing
    Write-Host "✅ 成功,共 $($response.total) 个道具" -ForegroundColor Green
    if ($response.items) {
        Write-Host "示例道具: $($response.items[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 诊断 4: /api/allinone
Write-Host "[诊断 4] 测试 /api/allinone..." -ForegroundColor Yellow
Write-Host "请求: $BASE_URL/api/allinone"
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/allinone" -Method Head -UseBasicParsing
    Write-Host "✅ 状态码: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 诊断 5: /api/allinone/auth/login
Write-Host "[诊断 5] 测试 /api/allinone/auth/login..." -ForegroundColor Yellow
Write-Host "请求: $BASE_URL/api/allinone/auth/login"
try {
    $body = @{
        userId = "test_001"
        username = "TestPlayer"
        platform = "newday"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/allinone/auth/login" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ 登录成功!" -ForegroundColor Green
    Write-Host "Token: $($response.token)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "HTTP 状态: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

# 诊断 6: CORS 检查
Write-Host "[诊断 6] 测试 CORS..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/allinone/auth/login" -Method Options -Headers @{
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
        "Origin" = "http://localhost:5173"
    } -UseBasicParsing

    $corsHeaders = $response.Headers | Where-Object { $_ -like "*Access-Control*" }
    if ($corsHeaders) {
        Write-Host "✅ CORS 头存在:" -ForegroundColor Green
        $corsHeaders | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    } else {
        Write-Host "⚠️  CORS 头不存在" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ CORS 失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  诊断完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "分析结果:" -ForegroundColor White
Write-Host "- 如果诊断 3 成功,说明 New Day 服务器正常运行" -ForegroundColor Gray
Write-Host "- 如果诊断 4/5 失败,说明 /api/allinone 端点未实现" -ForegroundColor Gray
Write-Host "- 如果诊断 6 失败,说明 CORS 未配置" -ForegroundColor Gray
Write-Host ""

Read-Host "按回车键退出"
