@echo off
title AstroSight - Planetary Surface AI
color 0B
cd /d "%~dp0"

echo =====================================================================
echo    ASTROSIGHT: LUNAR CRATER CLASSIFICATION & SPATIAL ANALYSIS
echo           AI-Powered Planetary Surface Intelligence
echo =====================================================================
echo Cleaning up any previous lingering instances on port 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo.

echo [1/2] Starting AstroSight FastAPI Backend Server on port 8000...
start "AstroSight Backend (FastAPI)" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo [2/2] Starting AstroSight Vite React Frontend on port 5173...
start "AstroSight Frontend (Vite React)" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul

echo Opening AstroSight Mission Control in your browser...
start http://localhost:5173

echo.
echo =====================================================================
echo AstroSight is now RUNNING!
echo Dashboard:         http://localhost:5173
echo Backend API Docs:  http://127.0.0.1:8000/docs
echo =====================================================================
pause
