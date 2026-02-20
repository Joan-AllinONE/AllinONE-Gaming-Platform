@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   AllinONE - 清除登录并启动
echo ============================================
echo.

echo [1/3] 停止现有服务器...
taskkill /F /IM node.exe 2>nul
echo ✓ 已停止

echo.
echo [2/3] 清除浏览器数据...
echo 请在浏览器中打开: file:///%~dp0clear_login.html
echo 然后点击"清除所有登录数据"按钮
echo.
pause

echo.
echo [3/3] 启动服务器...
start "AllinONE Backend" cmd /k "cd /d "%~dp0" && node server.js"
timeout /t 3 >nul
start "AllinONE Frontend" cmd /k "cd /d "%~dp0" && npm run dev:client"

echo.
echo ============================================
echo  服务器已启动
echo ============================================
echo.
echo 访问: http://localhost:3001
echo.
echo 注意: 现在每次都需要手动登录
echo.
pause
