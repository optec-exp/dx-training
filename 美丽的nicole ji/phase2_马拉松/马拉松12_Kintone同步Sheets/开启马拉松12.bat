@echo off
cd /d "%~dp0"
echo 安装依赖（含 googleapis）...
call npm install
echo 启动马拉松12 - Kintone同步Sheets...
call npm run dev
pause
