@echo off
title 作品31 - 货物状态查询
cd /d "%~dp0"
echo 正在启动 作品31: 货物状态查询...
start "" http://localhost:3031
npm run dev -- --port 3031
