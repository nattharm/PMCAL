@echo off
echo ==========================================
echo      PMCAL Project Repair Script
echo ==========================================
echo.
echo WARNING: This will delete 'node_modules' and 'package-lock.json'.
echo Please ensure VS Code and any running terminals are CLOSED.
echo.
pause

echo.
echo [1/5] Removing node_modules...
rmdir /s /q node_modules
if errorlevel 1 (
    echo Failed to remove node_modules. Please close all programs using this folder and try again.
    pause
    exit /b
)

echo.
echo [2/5] Removing package-lock.json...
del package-lock.json

echo.
echo [3/5] Cleaning npm cache...
call npm cache clean --force

echo.
echo [4/5] Installing dependencies...
call npm install
call npm install -D browserslist caniuse-lite
call npx update-browserslist-db@latest

echo.
echo [5/5] Testing Build...
call npm run build

echo.
echo ==========================================
echo      Repair Complete!
echo ==========================================
echo You can now re-open VS Code and run 'npm run dev'.
pause
