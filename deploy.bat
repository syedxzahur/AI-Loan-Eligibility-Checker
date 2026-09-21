@echo off
echo ===================================================
echo 🚀 Deploying AI Loan Eligibility Checker
echo ===================================================
echo Choose deployment target:
echo 1) Vercel
echo 2) Netlify
echo 3) Run Locally (http://localhost:3000)
echo.
set /p choice="Enter option (1, 2, or 3): "

if "%choice%"=="1" (
  echo Deploying to Vercel...
  npx vercel --prod
) else if "%choice%"=="2" (
  echo Deploying to Netlify...
  npx netlify deploy --prod --dir=public --functions=api
) else (
  echo Starting local server on http://localhost:3000 ...
  node server.js
)
pause
