@echo off
echo ========================================
echo     开发服务器状态检查
echo ========================================
echo.

echo 🔍 正在检查服务器状态...
echo.

:: 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装或未添加到 PATH
    echo 请先安装 Node.js: https://nodejs.org/
    goto :end
) else (
    echo ✅ Node.js 已安装
    node --version
)

:: 检查 npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未找到
    goto :end
) else (
    echo ✅ npm 已安装
    npm --version
)

echo.
echo 🌐 检查端口 5173 是否被占用...
netstat -an | find "5173" >nul
if %errorlevel% equ 0 (
    echo ✅ 端口 5173 正在使用中 (可能是开发服务器)
    echo 🔗 尝试访问: http://localhost:5173/
) else (
    echo ⚠️  端口 5173 未被占用
    echo 💡 需要启动开发服务器: npm run dev
)

echo.
echo 📋 启动开发服务器的步骤：
echo 1. 在项目根目录打开命令行
echo 2. 运行: npm install (如果是第一次)
echo 3. 运行: npm run dev
echo 4. 等待看到 "Local: http://localhost:5173/" 提示
echo 5. 访问: http://localhost:5173/personal-center
echo.

:end
echo 按任意键退出...
pause >nul