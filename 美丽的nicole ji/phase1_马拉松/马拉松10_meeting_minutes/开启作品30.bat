@echo off
title 作品30 - OPTEC会议记录
cd /d "%~dp0"
echo 正在启动 作品30: 会议记录模板...
start "" http://localhost:3030
npm run dev -- --port 3030
