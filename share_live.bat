@echo off
title AstroSight Mission Control - Global Public Tunnel
color 0B
cd /d "%~dp0"

echo ======================================================================
echo             ASTROSIGHT DIRECT GLOBAL PUBLIC TUNNEL
echo ======================================================================
echo.
echo [1/2] Verifying AstroSight Backend Server...
curl.exe -s http://127.0.0.1:8000/ >nul
if %errorlevel% neq 0 (
    echo [INFO] Starting AstroSight backend server on port 8000...
    start /min "AstroSight-Backend" py -3.13 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
    timeout /t 4 /nobreak >nul
) else (
    echo [OK] Backend server is online on port 8000.
)

echo.
echo [2/2] Connecting to Cloudflare Global Edge Network...
echo (NO passwords, NO interstitial warnings, NO IP prompts)
echo.
echo ======================================================================
echo   COPY YOUR LIVE PUBLIC LINK BELOW (ends in .trycloudflare.com):
echo ======================================================================
echo.
cloudflared.exe tunnel --url http://localhost:8000
pause
