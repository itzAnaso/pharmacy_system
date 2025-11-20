@echo off
REM Pharmacy Management System - Quick Start Script for Windows

echo ==========================================
echo   Pharmacy Management System
echo   Local Setup Script
echo ==========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Display Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%
echo.

REM Start the development server
echo Starting development server...
echo    The app will be available at: http://localhost:8080
echo.
echo    Press Ctrl+C to stop the server
echo.

call npm run dev

pause

