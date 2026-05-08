@echo off
title 作品28 - OPTEC座位表
cd /d "%~dp0"
echo 正在启动 作品28: OPTEC座位表...
start "" http://localhost:3028
npm run dev -- --port 3028
