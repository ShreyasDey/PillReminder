@echo off
REM Stops the SaathiPill backend, database and worker.
title SaathiPill - stopping
echo Stopping SaathiPill (database + backend + worker)...
docker compose down
echo Done. (The front-end window can be closed.)
timeout /t 3 /nobreak >nul
