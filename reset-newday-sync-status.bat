@echo off
chcp 65001 >nul
title 重置 New Day 道具同步状态
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   重置 New Day 道具同步状态                                    ║
echo ║                                                               ║
echo ║   此工具将所有 New Day 道具的 sync_status 重置为              ║
echo ║   'not_synced'（未同步）                                      ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo [警告] 此操作将：
echo   1. 将所有 New Day 道具标记为"未同步"
echo   2. 已同步到 New Day 游戏的道具将变为"未同步"状态
echo   3. 玩家需要重新点击"同步到 New Day"按钮
echo.
echo 是否继续？
set /p confirm="[Y/N]: "
if /i not "%confirm%"=="Y" (
    echo [信息] 操作已取消。
    goto :end
)

echo.
echo [信息] 正在重置...
node scripts\reset-sync-status.cjs
if %errorlevel% neq 0 (
    echo [错误] 重置失败。
)

:end
echo.
echo 按任意键退出...
pause >nul
