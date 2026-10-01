@echo off
title Push AstroSight to GitHub
color 0A
cd /d "%~dp0"

echo ======================================================================
echo              PUSH ASTROSIGHT TO GITHUB (kiranreddy105)
echo ======================================================================
echo.
echo Target Repository: https://github.com/kiranreddy105/astrosight
echo.
echo Make sure you have created the empty repository on GitHub first:
echo - Go to: https://github.com/new
echo - Repository Name: astrosight
echo - Leave README, .gitignore, and license UNCHECKED
echo.
echo Press any key to push your code now...
pause >nul

echo.
echo [1/2] Staging and confirming commit...
git add .
git commit -m "feat: AstroSight lunar crater platform" 2>nul
git branch -M main

echo.
echo [2/2] Pushing to GitHub (main branch)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo  SUCCESS! Your code is now live on GitHub:
    echo  https://github.com/kiranreddy105/astrosight
    echo ======================================================================
) else (
    echo.
    echo [NOTE] If push failed, make sure:
    echo 1. You created the repository at https://github.com/new named "astrosight"
    echo 2. You approved the GitHub login window if it popped up.
)

echo.
pause
