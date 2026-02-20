@echo off
chcp 65001 >nul
echo ========================================
echo New Day Wallet Foreign Key Fix
echo ========================================
echo.
echo This script will help you fix the wallet
echo foreign key constraint issue.
echo.
echo Please choose an option:
echo.
echo [1] View the SQL script (read-only)
echo [2] Open the SQL script in editor
echo [3] View detailed documentation
echo [4] Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo ========================================
    echo SQL Script Content:
    echo ========================================
    type fix-wallet-foreign-key.sql
    echo.
    pause
    exit
)

if "%choice%"=="2" (
    start notepad fix-wallet-foreign-key.sql
    exit
)

if "%choice%"=="3" (
    start FIX_WALLET_FOREIGN_KEY.md
    exit
)

if "%choice%"=="4" (
    exit
)

echo Invalid choice. Please run again.
pause
