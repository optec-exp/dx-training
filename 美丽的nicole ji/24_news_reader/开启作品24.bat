@echo off
cd /d "%~dp0"
echo 正在启动作品24 新闻阅读器...
start "" "http://localhost:3000"
npm run dev
