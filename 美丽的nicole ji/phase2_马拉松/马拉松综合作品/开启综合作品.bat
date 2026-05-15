@echo off
cd /d "%~dp0"
call npm install
start /min "Phase2 Integrated" cmd /k npm run dev
timeout /t 3 /nobreak >nul
start http://localhost:3000
exit
