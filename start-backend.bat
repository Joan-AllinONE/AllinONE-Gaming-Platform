@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   AllinONE 后端服务器启动
echo ============================================
echo.
echo 后端 API 地址: http://localhost:3000
echo 健康检查: http://localhost:3000/api/health
echo.
echo 按 Ctrl+C 停止服务器
echo.

node server.js

pause
