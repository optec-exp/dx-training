@echo off
cd /d "%~dp0"
echo 正在启动作品22 天气预报仪表盘...
start "" "http://localhost:3000"
npm run dev
