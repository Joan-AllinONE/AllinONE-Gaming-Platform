@echo off
chcp 65001 >nul
title AllinONE Sync Status Fix

echo ==========================================
echo   AllinONE Database Sync Status Fix Tool
echo ==========================================
echo.

:: Database config
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=allinone_db
set DB_USER=postgres

:: Get password
if defined DB_PASSWORD (
    set PGPASSWORD=%DB_PASSWORD%
    echo Using password from environment variable
) else (
    echo.
    echo Enter PostgreSQL password:
    set /p PGPASSWORD=
)

echo.
echo Database Configuration:
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo.

:: Check psql
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: psql command not found.
    echo Please install PostgreSQL and add it to PATH.
    pause
    exit /b 1
)

:: Test connection
echo Testing database connection...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to database.
    echo Please check:
    echo   1. PostgreSQL service is running
    echo   2. Database name is correct
    echo   3. Username and password are correct
    pause
    exit /b 1
)
echo Connection successful!
echo.

:: Show current status
echo Current sync_status distribution:
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT game_source, sync_status, COUNT(*) as count FROM cross_game_inventory GROUP BY game_source, sync_status ORDER BY game_source, sync_status;"
echo.

:: Menu
echo WARNING: This will modify the database default value.
echo.
echo Options:
echo   1. Fix default value only (recommended)
echo   2. Fix default value + reset all New Day items to not_synced
echo   3. Cancel
set /p choice="Select option [1/2/3]: "

if "%choice%"=="3" (
    echo Operation cancelled.
    goto :end
)

if "%choice%"=="1" (
    echo.
    echo Fixing default value...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "ALTER TABLE cross_game_inventory ALTER COLUMN sync_status SET DEFAULT 'not_synced';"
    if %errorlevel% equ 0 (
        echo SUCCESS: Default value fixed!
    ) else (
        echo ERROR: Failed to fix default value.
    )
)

if "%choice%"=="2" (
    echo.
    echo Fixing default value...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "ALTER TABLE cross_game_inventory ALTER COLUMN sync_status SET DEFAULT 'not_synced';"
    if %errorlevel% equ 0 (
        echo SUCCESS: Default value fixed!
    ) else (
        echo ERROR: Failed to fix default value.
        goto :end
    )
    
    echo.
    echo Resetting all New Day items to not_synced...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "UPDATE cross_game_inventory SET sync_status = 'not_synced' WHERE game_source = 'newday' AND sync_status = 'synced';"
    if %errorlevel% equ 0 (
        echo SUCCESS: New Day items reset!
    ) else (
        echo ERROR: Failed to reset items.
    )
)

:: Show result
echo.
echo Updated sync_status distribution:
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT game_source, sync_status, COUNT(*) as count FROM cross_game_inventory GROUP BY game_source, sync_status ORDER BY game_source, sync_status;"

echo.
echo ==========================================
echo   Fix Complete!
echo ==========================================
echo.
echo New New Day items will now show "Sync to New Day" button
echo instead of "Synced to New Day".
echo.

:end
echo.
pause
