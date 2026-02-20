@echo off
echo ========================================
echo   AllinONE 游戏平台 - 团队功能测试
echo ========================================
echo.

echo 🚀 正在启动测试环境...
echo.

echo 📋 选择测试方式：
echo [1] 离线演示版本 (无需服务器，立即体验)
echo [2] 完整功能测试 (需要启动开发服务器)
echo [3] 查看服务器启动指南
echo.

set /p choice="请输入选择 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🎮 正在打开离线演示版本...
    start "" "%~dp0offline-team-demo.html"
    echo ✅ 离线演示已打开！可以体验所有功能界面。
) else if "%choice%"=="2" (
    echo.
    echo 🔧 完整功能测试需要先启动开发服务器：
    echo.
    echo 1. 在项目根目录打开命令行
    echo 2. 运行: npm run dev 或 yarn dev
    echo 3. 等待服务器启动完成
    echo 4. 访问: http://localhost:5173/personal-center
    echo 5. 点击"团队中心"标签
    echo.
    echo 按任意键打开测试指南页面...
    pause >nul
    start "" "%~dp0team-test.html"
    echo ✅ 测试指南已打开！
) else if "%choice%"=="3" (
    echo.
    echo 📖 正在打开服务器启动指南...
    start "" "%~dp0SERVER_SETUP_GUIDE.md"
    echo ✅ 启动指南已打开！
) else (
    echo.
    echo ❌ 无效选择，正在打开离线演示...
    start "" "%~dp0offline-team-demo.html"
)

echo.
echo 💡 提示：
echo - 离线演示：可以体验界面和交互，但数据不会保存
echo - 完整测试：需要开发服务器，可以测试真实功能
echo.
pause