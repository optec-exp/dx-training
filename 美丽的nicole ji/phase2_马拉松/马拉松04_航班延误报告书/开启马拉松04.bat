@echo off
cd /d "%~dp0"
call npm install
echo 启动马拉松04 - 航班延误报告书...
call npm run dev
pause
