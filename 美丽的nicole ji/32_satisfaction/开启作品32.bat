@echo off
title 作品32 - 服务满意度评价
cd /d "%~dp0"
echo 正在启动 作品32: 服务满意度评价...
start "" http://localhost:3032
npm run dev -- --port 3032
