@echo off
chcp 65001 > nul
echo ========================================
echo New Day API 诊断工具启动器
echo ========================================
echo.
echo New Day 团队已完成 API 修复！
echo 请运行测试验证所有端点是否正常工作
echo.
echo 请选择要运行的诊断工具:
echo.
echo [1] PowerShell 诊断脚本（推荐，测试所有端点）
echo [2] CMD 诊断脚本
echo [3] 浏览器验证工具（测试 CORS）
echo [4] 查看集成文档
echo [0] 退出
echo.

set /p choice="请输入选项 (0-4): "

if "%choice%"=="1" goto powershell
if "%choice%"=="2" goto cmd
if "%choice%"=="3" goto browser
if "%choice%"=="4" goto guide
if "%choice%"=="0" goto end

goto invalid

:powershell
echo.
echo 正在启动 PowerShell 诊断脚本...
echo.
powershell -ExecutionPolicy Bypass -File diagnose-newday-api-issues.ps1
goto end

:cmd
echo.
echo 正在启动 CMD 诊断脚本...
echo.
diagnose-newday-api-issues.bat
goto end

:browser
echo.
echo 正在打开浏览器验证工具...
echo.
start test-newday-integration.html
goto end

:guide
echo.
echo 正在打开集成文档...
echo.
start NEW_DAY_INTEGRATION_GUIDE.md
goto end

:invalid
echo.
echo 无效的选项，请重新运行脚本
pause

:end
echo.
echo ========================================
echo 完成！
echo ========================================
echo.
echo 如果所有测试通过，请执行以下操作：
echo 1. 启动 AllinONE 应用: npm run dev
echo 2. 访问集成测试页: http://localhost:5173/newday-integration-test
echo 3. 开始使用跨平台功能
echo.
pause

