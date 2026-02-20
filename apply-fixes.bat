@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   AllinONE 快速修复脚本
echo ============================================
echo.

echo [1/3] 停止现有服务器...
taskkill /F /IM node.exe 2>nul
echo ✓ 已清理

echo.
echo [2/3] 修复完成，主要修改:
echo   - 后端API现在支持默认用户ID
echo   - 添加了调试日志
echo   - 前端token获取逻辑优化
echo ✓ 修复应用完成

echo.
echo [3/3] 启动服务器...
echo.
start "AllinONE Backend" cmd /k "cd /d "%~dp0" && echo 启动后端... && node server.js"
timeout /t 3 >nul
start "AllinONE Frontend" cmd /k "cd /d "%~dp0" && echo 启动前端... && npm run dev:client"

echo.
echo ============================================
echo  服务器启动中...
echo ============================================
echo.
echo 请等待5秒后刷新浏览器
echo 访问: http://localhost:3001
echo.
pause
