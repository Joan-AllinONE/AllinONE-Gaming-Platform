@echo off
chcp 65001 >nul
echo ==========================================
echo  AllinONE 数据库库存方案 - 一键部署脚本
echo ==========================================
echo.

REM 检查配置文件
if not exist ".env" (
    echo [错误] 找不到 .env 配置文件
    echo 请先创建 .env 文件，参考 .env.example
    pause
    exit /b 1
)

echo [1/5] 检查环境...
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] Node.js 未安装
    echo 请访问 https://nodejs.org/ 安装 Node.js
    pause
    exit /b 1
)
echo ✓ Node.js 已安装

echo.
echo [2/5] 安装依赖...
call npm install
if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo ✓ 依赖安装完成

echo.
echo [3/5] 检查数据库连接...
echo 请确保 PostgreSQL 服务已启动
echo.

REM 检查 psql 是否可用
psql --version >nul 2>&1
if errorlevel 1 (
    echo [警告] 找不到 psql 命令
    echo 请手动执行 database-schema-inventory.sql
    echo.
    choice /C YN /M "是否继续部署（跳过数据库初始化）"
    if errorlevel 2 exit /b 1
) else (
    echo ✓ PostgreSQL 客户端已找到
    echo.
    set /p DB_NAME=请输入数据库名称 [allinone_db]: 
    if "!DB_NAME!"=="" set DB_NAME=allinone_db
    
    echo [3/5] 执行数据库脚本...
    psql -d %DB_NAME% -f database-schema-inventory.sql
    if errorlevel 1 (
        echo [错误] 数据库脚本执行失败
        echo 请检查:
        echo   1. PostgreSQL 服务是否启动
        echo   2. 数据库 %DB_NAME% 是否存在
        echo   3. 连接权限是否正确
        pause
        exit /b 1
    )
    echo ✓ 数据库初始化完成
)

echo.
echo [4/5] 编译前端代码...
call npm run build
if errorlevel 1 (
    echo [错误] 编译失败
    pause
    exit /b 1
)
echo ✓ 编译完成

echo.
echo [5/5] 启动服务...
echo.
echo ==========================================
echo  部署完成！
echo ==========================================
echo.
echo 启动命令:
echo   npm run dev    - 开发模式
echo   npm start      - 生产模式
echo.
echo 验证部署:
echo   1. 打开浏览器访问 http://localhost:3000
echo   2. 登录账号
echo   3. 进入游戏中心，点击 New Day
echo   4. 查看控制台同步日志
echo.
pause
