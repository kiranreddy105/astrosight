# AstroSight PowerShell Launcher
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   ASTROSIGHT: LUNAR CRATER CLASSIFICATION & SPATIAL ANALYSIS" -ForegroundColor White
Write-Host "          AI-Powered Planetary Surface Intelligence" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot

Write-Host "`n[1/2] Starting AstroSight FastAPI Backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkspaceRoot'; python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[2/2] Starting AstroSight Vite Frontend on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkspaceRoot\frontend'; npm run dev"

Write-Host "`nAstroSight is launching!" -ForegroundColor Cyan
Write-Host "Backend API:  http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend Dashboard: http://localhost:5173" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
