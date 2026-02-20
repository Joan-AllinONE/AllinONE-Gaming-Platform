@echo off
chcp 65001 >nul
cls
echo.
echo ========================================================
echo    AllinONE Gaming Platform - 完整部署脚本
echo ========================================================
echo.

REM 检查 Node.js
echo [1/6] 检查 Node.js 环境...
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] Node.js 未安装
    echo 请访问 https://nodejs.org/ 安装 Node.js
    pause
    exit /b 1
)
echo ✓ Node.js 已安装

REM 检查 npm
npm -v >nul 2>&1
if errorlevel 1 (
    echo [错误] npm 不可用
    pause
    exit /b 1
)
echo ✓ npm 已安装

REM 检查 .env 文件
echo.
echo [2/6] 检查环境变量配置...
if not exist ".env" (
    echo [错误] .env 文件不存在
    echo 请先配置 .env 文件
    pause
    exit /b 1
)
echo ✓ .env 文件已找到

REM 安装依赖
echo.
echo [3/6] 安装项目依赖...
call npm install
if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo ✓ 依赖安装完成

REM 初始化数据库
echo.
echo [4/6] 初始化数据库...
call node scripts/init-database.js
if errorlevel 1 (
    echo [错误] 数据库初始化失败
    echo 请确保:
    echo   1. PostgreSQL 服务已启动
    echo   2. .env 文件中 DB_PASSWORD 配置正确
    echo   3. 数据库用户有创建表的权限
    pause
    exit /b 1
)
echo ✓ 数据库初始化完成

REM 构建前端
echo.
echo [5/6] 构建前端应用...
call npm run build
if errorlevel 1 (
    echo [错误] 前端构建失败
    pause
    exit /b 1
)
echo ✓ 前端构建完成

echo.
echo ========================================================
echo    ✅ 部署完成!
echo ========================================================
echo.
echo 下一步操作:
echo   1. 运行: npm run dev     - 启动开发服务器
echo   2. 运行: npm start       - 启动生产服务器
echo.
echo 验证部署:
echo   1. 访问 http://localhost:3000
echo   2. 登录账号
echo   3. 进入游戏中心，点击 New Day
echo   4. 查看控制台同步日志
echo.
pause
