@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松15 - Sheets同步Kintone...
call npm run dev
pause
