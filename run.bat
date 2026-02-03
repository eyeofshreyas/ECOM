@echo off
echo Starting ECOM Application...

:: Ensure we are in the script's directory
cd /d "%~dp0"

echo Launching Backend...
start "ECOM Backend" "backend\run_backend.bat"

echo Launching Frontend...
start "ECOM Frontend" "frontend\run_frontend.bat"

echo Servers launched in separate windows.
pause
