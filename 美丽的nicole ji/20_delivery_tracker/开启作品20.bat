@echo off
cd /d "%~dp0"
echo 正在启动作品20 配送期限追踪器...
start "" "http://localhost:3000"
npm run dev
