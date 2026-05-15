@echo off
cd /d "%~dp0"
start "" "http://localhost:3000"
cmd /k "npm run dev"
