@echo off
chcp 65001 >nul
cls
echo.
echo ========================================================
echo    AllinONE Gaming Platform - 部署检查
echo ========================================================
echo.

REM 检查 Node.js
echo [检查] Node.js...
node -v
if errorlevel 1 (
    echo ✗ Node.js 未安装
    pause
    exit /b 1
) else (
    echo ✓ Node.js 已安装
)

echo.
echo [检查] npm...
npm -v
if errorlevel 1 (
    echo ✗ npm 不可用
    pause
    exit /b 1
) else (
    echo ✓ npm 已安装
)

echo.
echo [检查] 依赖包...
if exist "node_modules\" (
    echo ✓ 依赖已安装
) else (
    echo ✗ 依赖未安装,请运行: npm install
)

echo.
echo [检查] .env 文件...
if exist ".env" (
    echo ✓ .env 文件存在
) else (
    echo ✗ .env 文件不存在
    echo 请先创建 .env 文件,参考 .env.example
)

echo.
echo [检查] 后端服务器文件...
if exist "server.js" (
    echo ✓ server.js 存在
) else (
    echo ✗ server.js 不存在
)

echo.
echo [检查] 数据库脚本...
if exist "database-schema-inventory.sql" (
    echo ✓ database-schema-inventory.sql 存在
) else (
    echo ✗ database-schema-inventory.sql 不存在
)

echo.
echo ========================================================
echo    部署检查完成
echo ========================================================
echo.
echo 下一步:
echo 1. 确保 PostgreSQL 服务已启动
echo 2. 创建数据库: allinone_db
echo 3. 运行数据库初始化: node scripts/init-database.cjs
echo 4. 启动开发服务器: npm run dev
echo.
pause
