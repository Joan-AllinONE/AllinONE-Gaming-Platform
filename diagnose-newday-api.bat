@echo off
chcp 65001 >nul
cls
echo ========================================
echo   New Day API 诊断工具
echo ========================================
echo.

set BASE_URL=https://yxp6y2qgnh.coze.site

echo [诊断 1] 测试基础连接...
echo 请求: %BASE_URL%
curl -I "%BASE_URL%" 2>&1 | findstr /C:"HTTP" /C:"Content-Type"
echo.
echo.

echo [诊断 2] 测试 /api 路径 (New Day 原生 API)...
echo 请求: %BASE_URL%/api
curl -I "%BASE_URL%/api" 2>&1 | findstr /C:"HTTP" /C:"Content-Type"
echo.
echo.

echo [诊断 3] 测试 /api/shared/marketplace (共享市场 API)...
echo 请求: %BASE_URL%/api/shared/marketplace
curl "%BASE_URL%/api/shared/marketplace?gameSource=New+Day" 2>&1
echo.
echo.

echo [诊断 4] 测试 /api/allinone 路径 (AllinONE 集成 API)...
echo 请求: %BASE_URL%/api/allinone
curl -I "%BASE_URL%/api/allinone" 2>&1 | findstr /C:"HTTP" /C:"Content-Type"
echo.
echo.

echo [诊断 5] 测试 /api/allinone/auth/login...
echo 请求: %BASE_URL%/api/allinone/auth/login
curl -X POST "%BASE_URL%/api/allinone/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"test\",\"username\":\"Test\",\"platform\":\"newday\"}" ^
  2>&1
echo.
echo.

echo [诊断 6] 测试 OPTIONS 请求 (检查 CORS)...
echo 请求: OPTIONS %BASE_URL%/api/allinone/auth/login
curl -X OPTIONS "%BASE_URL%/api/allinone/auth/login" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: Content-Type" ^
  -H "Origin: http://localhost:5173" ^
  -v 2>&1 | findstr /C:"Access-Control" /C:"HTTP"
echo.
echo.

echo ========================================
echo   诊断完成
echo ========================================
echo.
echo 分析结果:
echo - 如果诊断 3 成功,说明 New Day 服务器正常
echo - 如果诊断 4/5 失败,说明 /api/allinone 端点不存在
echo - 如果诊断 6 没有 CORS 头,说明 CORS 未配置
echo.
pause
