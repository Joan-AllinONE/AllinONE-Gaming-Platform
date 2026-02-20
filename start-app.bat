@echo off
chcp 65001 >nul
cls
echo.
echo ========================================================
echo    AllinONE Gaming Platform - 启动应用
echo ========================================================
echo.

echo 正在启动开发服务器...
echo.
echo 访问地址:
echo   - 后端 API: http://localhost:3000
echo   - 前端开发: http://localhost:3001
echo.
echo 按下 Ctrl+C 停止服务器
echo.

npm run dev

pause
