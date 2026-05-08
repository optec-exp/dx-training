@echo off
title 作品35 - 案件汇报书
cd /d "%~dp0"
echo 正在启动 作品35: 案件汇报书生成...
start "" http://localhost:3035
npm run dev -- --port 3035
