@echo off
chcp 65001 >nul
cls
echo.
echo ============================================
echo   AllinONE 一键启动脚本
echo ============================================
echo.

REM 清理现有进程
echo [1/3] 清理现有进程...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo ✓ 清理完成

echo.
echo [2/3] 启动后端服务器...
echo.
start "AllinONE Backend" cmd /k "cd /d "%~dp0" && node server.js"

echo 等待后端启动...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] 启动前端开发服务器...
echo.
start "AllinONE Frontend" cmd /k "cd /d "%~dp0" && npm run dev:client"

echo.
echo ============================================
echo  启动完成!
echo ============================================
echo.
echo 访问地址:
echo   后端 API: http://localhost:3000
echo   前端应用: http://localhost:3001
echo.
echo 诊断页面:
echo   file:///%~dp0diagnose-issues.html
echo.
echo 按任意键关闭此窗口 (服务器会继续运行)
echo.
pause >nul
