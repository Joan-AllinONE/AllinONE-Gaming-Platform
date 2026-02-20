@echo off
chcp 65001 >nul
echo ========================================
echo   New Day API 测试脚本
echo ========================================
echo.

set API_BASE=https://yxp6y2qgnh.coze.site/api/allinone

echo [1/5] 测试登录认证...
curl -X POST "%API_BASE%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"test_001\",\"username\":\"TestPlayer\",\"platform\":\"newday\"}" ^
  2>nul
echo.
echo.

echo [2/5] 测试获取钱包余额 (需要先登录)...
echo 提示: 请复制上一步获取的 token
echo.
pause

set /p TOKEN="请输入 Token: "

curl -H "Authorization: Bearer %TOKEN%" "%API_BASE%/wallet/balance" 2>nul
echo.
echo.

echo [3/5] 测试获取用户库存...
curl -H "Authorization: Bearer %TOKEN%" "%API_BASE%/inventory" 2>nul
echo.
echo.

echo [4/5] 测试获取市场列表...
curl -H "Authorization: Bearer %TOKEN%" "%API_BASE%/market/items?platform=newday" 2>nul
echo.
echo.

echo [5/5] 测试上架道具...
curl -X POST "%API_BASE%/market/list" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"测试道具\",\"description\":\"这是一个测试道具\",\"platform\":\"newday\",\"itemType\":\"weapon\",\"price\":{\"gameCoins\":100}}" ^
  2>nul
echo.
echo.

echo ========================================
echo   测试完成
echo ========================================
pause
