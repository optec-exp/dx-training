@echo off
title 作品34 - 服务诊断工具
cd /d "%~dp0"
echo 正在启动 作品34: 服务诊断工具...
start "" http://localhost:3034
npm run dev -- --port 3034
