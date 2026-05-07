@echo off
cd /d "%~dp0"
echo 正在启动作品21 汇率显示应用...
start "" "http://localhost:3000"
npm run dev
