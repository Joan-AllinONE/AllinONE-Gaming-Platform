@echo off
echo ====================================================
echo Production Database Fix Script
echo ====================================================
echo.

REM Prompt for database connection info
echo Please enter production database connection info:
echo.
set /p DB_HOST="Database Host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Database Port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME="Database Name (default: newday_prod): "
if "%DB_NAME%"=="" set DB_NAME=newday_prod

set /p DB_USER="Database User (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_PASSWORD="Database Password: "

echo.
echo ====================================================
echo Connecting to production database...
echo ====================================================
echo.

REM Set PGPASSWORD environment variable
set PGPASSWORD=%DB_PASSWORD%

REM Execute SQL script
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -f "execute-production-fix.sql"

REM Check execution result
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo SQL script executed successfully!
    echo ====================================================
    echo.
    echo Please check the verification results above:
    echo 1. Foreign key constraints removed (should be empty)
    echo 2. System user created (should show system user)
    echo.
) else (
    echo.
    echo ====================================================
    echo SQL script execution failed!
    echo ====================================================
    echo.
    echo Error code: %ERRORLEVEL%
    echo Please check:
    echo 1. Database connection info is correct
    echo 2. psql is installed and in PATH
    echo 3. Database user has sufficient permissions
    echo.
)

REM Clear environment variable
set PGPASSWORD=

echo Press any key to exit...
pause >nul
