@echo off
cd /d "%~dp0"
call npm install
echo 启动马拉松03 - AWB清单PDF...
call npm run dev
pause
