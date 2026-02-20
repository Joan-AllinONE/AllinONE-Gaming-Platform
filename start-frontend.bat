@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   AllinONE 前端开发服务器启动
echo ============================================
echo.
echo 前端地址: http://localhost:3001
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev:client

pause
