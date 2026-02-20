@echo off
chcp 65001 >nul
echo ========================================
echo   New Day API 自动测试脚本
echo ========================================
echo.

set API_BASE=https://yxp6y2qgnh.coze.site/api/allinone

echo [1/5] 测试登录认证...
set RESPONSE_FILE=%TEMP%\newday_login_response.json
curl -s -X POST "%API_BASE%/auth/login" -H "Content-Type: application/json" -d "{\"userId\":\"test_001\",\"username\":\"TestPlayer\",\"platform\":\"newday\"}" -o "%RESPONSE_FILE%"
type "%RESPONSE_FILE%"
echo.

REM 使用 PowerShell 提取 token
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%RESPONSE_FILE%' | ConvertFrom-Json).token"') do set TOKEN=%%i

if "%TOKEN%"=="" (
    echo ❌ 无法提取 Token,请检查响应
    del "%RESPONSE_FILE%" 2>nul
    pause
    exit /b
)

echo ✅ 成功提取 Token!
echo Token: %TOKEN%
echo.
del "%RESPONSE_FILE%" 2>nul
pause

echo [2/5] 测试获取钱包余额...
echo ----------------------------------------
curl -s -H "Authorization: Bearer %TOKEN%" "%API_BASE%/wallet/balance"
echo.
echo.
pause

echo [3/5] 测试获取用户库存...
echo ----------------------------------------
curl -s -H "Authorization: Bearer %TOKEN%" "%API_BASE%/inventory"
echo.
echo.
pause

echo [4/5] 测试获取市场列表...
echo ----------------------------------------
curl -s -H "Authorization: Bearer %TOKEN%" "%API_BASE%/market/items?platform=newday"
echo.
echo.
pause

echo [5/5] 测试上架道具...
echo ----------------------------------------
curl -s -X POST "%API_BASE%/market/list" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"测试道具_自动测试\",\"description\":\"自动测试生成的道具\",\"platform\":\"newday\",\"itemType\":\"weapon\",\"price\":{\"gameCoins\":100}}"
echo.
echo.

echo ========================================
echo   所有测试完成
echo ========================================
pause
