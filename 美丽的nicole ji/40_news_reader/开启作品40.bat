@echo off
title 作品40 - 行业新闻阅读器
cd /d "%~dp0"
echo 正在启动 作品40: 行业新闻阅读器...
start "" http://localhost:3040
npm run dev -- --port 3040
