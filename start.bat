@echo off
chcp 65001 > nul
title Al-Fajr Charity HR System
color 0A

echo ======================================================================
echo       Al-Fajr Charity Foundation - Attendance & Leaves System
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [IMPORTANT NOTICE] Node.js is not installed on your system!
    echo To run modern React / Vite applications locally, you need Node.js.
    echo Download and install it for free from: https://nodejs.org
    echo After installation, run this file again.
    echo ======================================================================
    pause
    exit /b
)

if not exist node_modules (
    echo [1/2] Installing required dependencies (one-time setup, please wait)...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo Error installing packages. Please check your internet connection.
        pause
        exit /b
    )
)

echo.
echo [2/2] Starting local web server...
echo The app will automatically open in your default browser at:
echo http://localhost:3000
echo ======================================================================
echo.

start "" "http://localhost:3000"
call npm run dev

pause
