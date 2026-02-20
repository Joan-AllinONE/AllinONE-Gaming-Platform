@echo off
chcp 65001 >nul
echo ========================================
echo Production Fix Verification Tool
echo ========================================
echo.
echo This tool will help you verify if the
echo production database fix has been applied.
echo.

echo Testing: https://yxp6y2qgnh.coze.site/api/shared/wallet/allinone-prod-test-123
echo.

echo Please choose an option:
echo.
echo [1] Test wallet creation via curl
echo [2] Open verification guide
echo [3] Open SQL fix script
echo [4] Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Testing wallet creation...
    echo.
    curl -X GET "https://yxp6y2qgnh.coze.site/api/shared/wallet/allinone-prod-test-123"
    echo.
    echo.
    echo ========================================
    echo Expected Result:
    echo ========================================
    echo {
    echo   "wallet": {
    echo     "id": "uuid-here",
    echo     "userId": "allinone-prod-test-123",
    echo     "gameCoins": 1000,
    echo     "cashBalance": 0,
    echo     "computingPower": 0
    echo   },
    echo   "isNewWallet": true
    echo }
    echo.
    pause
    exit
)

if "%choice%"=="2" (
    start PRODUCTION_FIX_GUIDE.md
    exit
)

if "%choice%"=="3" (
    start fix-wallet-foreign-key.sql
    exit
)

if "%choice%"=="4" (
    exit
)

echo Invalid choice. Please run again.
pause
