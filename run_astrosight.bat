@echo off
title AstroSight - Planetary Surface AI
echo =====================================================================
echo    ASTROSIGHT: LUNAR CRATER CLASSIFICATION & SPATIAL ANALYSIS
echo           AI-Powered Planetary Surface Intelligence
echo =====================================================================
echo.

echo [1/2] Starting AstroSight FastAPI Backend Server on port 8000...
start "AstroSight Backend (FastAPI)" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting AstroSight Vite Frontend on port 5173...
start "AstroSight Frontend (Vite React)" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo AstroSight is launching!
echo Backend API Docs: http://127.0.0.1:8000/docs
echo Mission Control Dashboard: http://localhost:5173
echo =====================================================================
pause
