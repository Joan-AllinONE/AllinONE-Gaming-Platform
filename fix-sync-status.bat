@echo off
chcp 65001 >nul
title AllinONE 数据库 Sync Status 修复工具
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   AllinONE 数据库 Sync Status 默认值修复工具                   ║
echo ║                                                               ║
echo ║   此工具将修复数据库中 sync_status 字段的默认值问题            ║
echo ║   将默认值从 'synced' 改为 'not_synced'                       ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: 检查 PostgreSQL 是否安装
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 psql 命令。请确保 PostgreSQL 已安装并添加到系统 PATH。
    echo.
    echo 解决方法：
    echo 1. 安装 PostgreSQL
    echo 2. 将 PostgreSQL 的 bin 目录添加到系统 PATH 环境变量
    echo    例如：C:\Program Files\PostgreSQL\14\bin
    echo.
    pause
    exit /b 1
)

:: 数据库连接配置
echo [信息] 正在读取数据库配置...
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=allinone_db
set DB_USER=postgres

:: 从环境变量读取密码（如果设置了）
if defined DB_PASSWORD (
    set PGPASSWORD=%DB_PASSWORD%
    echo [信息] 使用环境变量中的密码
) else (
    echo.
    echo [提示] 请输入 PostgreSQL 密码（输入时不会显示）：
    set /p PGPASSWORD=
)

echo.
echo [信息] 数据库连接信息：
echo   主机: %DB_HOST%
echo   端口: %DB_PORT%
echo   数据库: %DB_NAME%
echo   用户: %DB_USER%
echo.

:: 测试数据库连接
echo [信息] 正在测试数据库连接...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 无法连接到数据库。请检查：
    echo   1. PostgreSQL 服务是否正在运行
    echo   2. 数据库名称是否正确
    echo   3. 用户名和密码是否正确
    echo.
    pause
    exit /b 1
)
echo [成功] 数据库连接成功！
echo.

:: 显示当前的 sync_status 分布
echo [信息] 当前 sync_status 分布情况：
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT game_source, sync_status, COUNT(*) as count FROM cross_game_inventory GROUP BY game_source, sync_status ORDER BY game_source, sync_status;"
echo.

:: 确认是否继续
echo [警告] 此操作将修改数据库默认值。
echo.
echo 可选操作：
echo   1. 仅修改默认值（推荐，新道具将默认未同步）
echo   2. 修改默认值 + 重置所有 New Day 道具为未同步
echo   3. 取消操作
echo.
set /p choice="请选择操作 [1/2/3]: "

if "%choice%"=="3" (
    echo [信息] 操作已取消。
    goto :end
)

if "%choice%"=="1" (
    echo.
    echo [信息] 正在修改默认值...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "ALTER TABLE cross_game_inventory ALTER COLUMN sync_status SET DEFAULT 'not_synced';"
    if %errorlevel% equ 0 (
        echo [成功] 默认值修改成功！
    ) else (
        echo [错误] 修改默认值失败。
        goto :end
    )
)

if "%choice%"=="2" (
    echo.
    echo [信息] 正在修改默认值...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "ALTER TABLE cross_game_inventory ALTER COLUMN sync_status SET DEFAULT 'not_synced';"
    if %errorlevel% equ 0 (
        echo [成功] 默认值修改成功！
    ) else (
        echo [错误] 修改默认值失败。
        goto :end
    )
    
    echo.
    echo [信息] 正在重置所有 New Day 道具为未同步状态...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "UPDATE cross_game_inventory SET sync_status = 'not_synced' WHERE game_source = 'newday' AND sync_status = 'synced';"
    if %errorlevel% equ 0 (
        echo [成功] New Day 道具状态重置成功！
    ) else (
        echo [错误] 重置状态失败。
        goto :end
    )
)

:: 显示修改后的 sync_status 分布
echo.
echo [信息] 修改后的 sync_status 分布情况：
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT game_source, sync_status, COUNT(*) as count FROM cross_game_inventory GROUP BY game_source, sync_status ORDER BY game_source, sync_status;"

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   修复完成！                                                   ║
echo ║                                                               ║
echo ║   现在新购买的 New Day 道具将默认显示"同步到 New Day"按钮      ║
echo ║   而不是"已同步到 New Day"                                    ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:end
echo.
echo 按任意键退出...
pause >nul
