@echo off
chcp 65001 > nul
echo ========================================
echo New Day API 诊断脚本（绕过 CORS）
echo ========================================
echo.

set API_BASE=https://yxp6y2qgnh.coze.site

echo 测试 1: 检查共享市场 API 的 CORS 配置
echo.
curl -i -X OPTIONS "%API_BASE%/api/shared/marketplace" ^
  -H "Origin: http://localhost:5173" ^
  -H "Access-Control-Request-Method: GET"
echo.
echo ----------------------------------------
echo.

echo 测试 2: 测试共享市场 API（GET 请求）
echo.
curl -i "%API_BASE%/api/shared/marketplace"
echo.
echo ----------------------------------------
echo.

echo 测试 3: 测试共享钱包 API
echo.
curl -i "%API_BASE%/api/shared/wallet/test-player-id"
echo.
echo ----------------------------------------
echo.

echo 测试 4: 测试 AllinONE 登录（参数格式 1: username/password）
echo.
curl -i -X POST "%API_BASE%/api/allinone/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"test\",\"password\":\"test\"}"
echo.
echo ----------------------------------------
echo.

echo 测试 5: 测试 AllinONE 登录（参数格式 2: allinoneUserId）
echo.
curl -i -X POST "%API_BASE%/api/allinone/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"allinoneUserId\":\"test-user-123\",\"allinoneUsername\":\"testuser\"}"
echo.
echo ----------------------------------------
echo.

echo 测试 6: 测试 AllinONE 登录（参数格式 3: playerId）
echo.
curl -i -X POST "%API_BASE%/api/allinone/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"playerId\":\"test-player-id\"}"
echo.
echo ----------------------------------------
echo.

echo 测试 7: 测试 AllinONE 库存 API（无认证）
echo.
curl -i "%API_BASE%/api/allinone/inventory"
echo.
echo ----------------------------------------
echo.

echo 测试 8: 测试 AllinONE 市场 API（GET）
echo.
curl -i "%API_BASE%/api/allinone/market/list"
echo.
echo ----------------------------------------
echo.

echo 测试 9: 测试 AllinONE 市场 API（POST）
echo.
curl -i -X POST "%API_BASE%/api/allinone/market/list" ^
  -H "Content-Type: application/json" ^
  -d "{}"
echo.
echo ----------------------------------------
echo.

echo 测试 10: 测试 AllinONE 钱包 API（无认证）
echo.
curl -i "%API_BASE%/api/allinone/wallet/balance"
echo.
echo ----------------------------------------
echo.

echo.
echo ========================================
echo 诊断完成！
echo ========================================
echo.
echo 请将上述输出保存并发送给 New Day 团队
pause
