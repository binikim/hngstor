@echo off
chcp 65001 >nul
echo =======================================
echo Starting GitHub upload...
echo =======================================

git init
git config user.email "binikim@example.com"
git config user.name "binikim"
git add .
git commit -m "update"
git branch -M main
git remote add origin https://github.com/binikim/hngstor.git
git push -u origin main -f

echo.
echo =======================================
echo Upload completed!
echo Please check the Vercel dashboard.
echo =======================================
pause
