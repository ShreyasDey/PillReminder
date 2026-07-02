@echo off
REM ============================================================
REM  SaathiPill — one-command start
REM  Double-click this file (or run "start.cmd" in a terminal).
REM  Requires: Docker Desktop running, and Node.js installed.
REM ============================================================
title SaathiPill
echo.
echo   Starting SaathiPill...
echo   (the first run builds the backend and can take a few minutes)
echo.

REM 1) Start the database + backend + reminder worker via Docker.
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo   ERROR: Could not start Docker. Is Docker Desktop running?
  echo   Open Docker Desktop, wait for it to say "running", then try again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Waiting for the backend to be ready...
:waitloop
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
  timeout /t 3 /nobreak >nul
  goto waitloop
)
echo   Backend is ready.
echo.

REM 1b) Ask whether to wipe everything and reset to a clean demo.
REM      Default (just press Enter) = KEEP all existing patient + pharmacy data.
echo   ============================================================
echo     Your data is KEPT by default across restarts.
echo     Type  y  ONLY if you want to ERASE everything (all patients,
echo     pharmacies, orders, reminders) and start from a clean demo.
echo   ============================================================
set "RESET="
set /p "RESET=  Clear ALL data and reset to a clean demo? (y/N): "
if /i "%RESET%"=="y" (
  echo.
  echo   Clearing all data and reseeding a clean demo...
  docker compose exec -T api npx prisma migrate reset --force --skip-generate
  echo   Done. Database reset to a clean demo.
) else (
  echo   Keeping your existing data.
)
echo.

REM 2) Open both apps in the browser.
echo   Opening the apps:
echo      Patient app:     http://localhost:5173
echo      Pharmacy portal: http://localhost:5174
echo.
echo   Demo logins (the code shows on screen):
echo      Patient    phone 9876543210
echo      Pharmacist phone 9000000001
echo.
echo   Keep this window OPEN while you use the apps.
echo   To stop everything, close this window and run stop.cmd
echo.
start "" http://localhost:5173
start "" http://localhost:5174

REM 3) Serve the two front-ends (this keeps running).
node serve-frontends.mjs
