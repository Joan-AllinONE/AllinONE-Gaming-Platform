@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   AllinONE 服务器启动脚本
echo ============================================
echo.

REM 检查 .env 文件
if not exist ".env" (
    echo [错误] 找不到 .env 文件
    pause
    exit /b 1
)

echo [1/3] 检查端口 3000...
netstat -ano | findstr ":3000" >nul
if %errorlevel% == 0 (
    echo [警告] 端口 3000 已被占用
    echo 尝试关闭占用端口的进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 >nul
)
echo ✓ 端口检查完成

echo.
echo [2/3] 启动后端服务器...
echo.
echo 服务器启动后,请访问:
echo   - 后端 API: http://localhost:3000
echo   - 健康检查: http://localhost:3000/api/health
echo.
echo 按 Ctrl+C 停止服务器
echo.

REM 启动服务器
node server.js

pause
