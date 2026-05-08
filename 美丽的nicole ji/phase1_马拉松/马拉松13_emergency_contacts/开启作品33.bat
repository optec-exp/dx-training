@echo off
title 作品33 - 紧急联系人（客户版）
cd /d "%~dp0"
echo 正在启动 作品33: 紧急联系人...
start "" http://localhost:3033
npm run dev -- --port 3033
