@echo off
chcp 65001 >nul
cls
echo.
echo ============================================
echo   AllinONE 服务器 - 清理并启动
echo ============================================
echo.

REM 清理端口占用
echo [1/4] 清理端口占用...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002"') do (
    taskkill /F /PID %%a 2>nul
)
echo ✓ 端口清理完成

echo.
echo [2/4] 等待端口释放...
timeout /t 2 /nobreak >nul
echo ✓ 准备就绪

echo.
echo [3/4] 检查环境变量...
if not exist ".env" (
    echo [错误] .env 文件不存在
    pause
    exit /b 1
)
echo ✓ 环境变量配置正常

echo.
echo [4/4] 启动开发服务器...
echo.
echo ============================================
echo  服务器地址:
echo    后端 API: http://localhost:3000
echo    前端开发: http://localhost:3001
echo ============================================
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause
