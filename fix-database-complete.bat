@echo off
chcp 65001 >nul
title AllinONE 数据库完整修复工具
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   AllinONE 数据库完整修复工具                                  ║
echo ║                                                               ║
echo ║   此工具将：                                                   ║
echo ║   1. 检查并创建 allinone_db 数据库（如果不存在）              ║
echo ║   2. 修复 sync_status 默认值问题                              ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: 设置数据库配置
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=allinone_db
set DB_USER=postgres

:: 读取环境变量中的密码
if defined DB_PASSWORD (
    set PGPASSWORD=%DB_PASSWORD%
    echo [信息] 使用环境变量中的密码
) else (
    echo.
    echo [提示] 请输入 PostgreSQL 密码（输入时不会显示）：
    set /p PGPASSWORD=
)

echo.
echo [信息] 数据库配置：
echo   主机: %DB_HOST%
echo   端口: %DB_PORT%
echo   数据库: %DB_NAME%
echo   用户: %DB_USER%
echo.

:: 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js。请确保 Node.js 已安装并添加到系统 PATH。
    echo.
    pause
    exit /b 1
)

:: 检查 .env 文件是否存在
if not exist .env (
    echo [警告] 未找到 .env 文件，将使用默认配置
    echo   DB_HOST=%DB_HOST%
    echo   DB_PORT=%DB_PORT%
    echo   DB_NAME=%DB_NAME%
    echo   DB_USER=%DB_USER%
    echo.
    echo 是否继续？
    set /p continue="[Y/N]: "
    if /i not "%continue%"=="Y" (
        echo [信息] 操作已取消。
        goto :end
    )
) else (
    echo [信息] 检测到 .env 文件，将使用其中的配置
)

echo.
echo [步骤 1/3] 检查并创建数据库...
echo ========================================
node scripts\create-database.cjs
if %errorlevel% neq 0 (
    echo [错误] 数据库创建失败。
    goto :end
)

echo.
echo [步骤 2/3] 初始化数据库表结构...
echo ========================================
node scripts\init-database.cjs
if %errorlevel% neq 0 (
    echo [错误] 数据库初始化失败。
    goto :end
)

echo.
echo [步骤 3/3] 修复 sync_status 默认值...
echo ========================================

:: 检查 psql 是否可用
where psql >nul 2>nul
if %errorlevel% equ 0 (
    echo [信息] 使用 psql 修改默认值...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "ALTER TABLE cross_game_inventory ALTER COLUMN sync_status SET DEFAULT 'not_synced';"
    if %errorlevel% equ 0 (
        echo [成功] 默认值修改成功！
    ) else (
        echo [警告] psql 修改失败，但数据库初始化已使用正确的默认值
    )
) else (
    echo [信息] psql 命令不可用，跳过手动修改步骤
    echo [信息] 数据库初始化脚本已使用正确的默认值
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   修复完成！                                                   ║
echo ║                                                               ║
echo ║   现在：                                                       ║
echo ║   1. allinone_db 数据库已创建（如果不存在）                   ║
echo ║   2. 数据库表结构已初始化                                      ║
echo ║   3. sync_status 默认值已设置为 'not_synced'                  ║
echo ║                                                               ║
echo ║   新购买的 New Day 道具将默认显示"同步到 New Day"按钮          ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo [提示] 如果之前已经购买过道具，它们可能仍然显示"已同步"
echo        这是因为旧数据保留了之前的状态。
echo        如需重置所有 New Day 道具状态，请运行：
echo        node scripts\reset-sync-status.cjs
echo.

:end
echo.
echo 按任意键退出...
pause >nul
