@echo off
cd /d "%~dp0"
echo 正在启动作品19 出货前确认检查清单...
start "" "http://localhost:3000"
npm run dev
