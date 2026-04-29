@echo off
title 作品37 - 通关知识学习卡
cd /d "%~dp0"
echo 正在启动 作品37: 通关知识学习卡...
start "" http://localhost:3037
npm run dev -- --port 3037
