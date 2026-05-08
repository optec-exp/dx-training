@echo off
title 作品29 - OPTEC社内FAQ
cd /d "%~dp0"
echo 正在启动 作品29: 社内FAQ...
start "" http://localhost:3029
npm run dev -- --port 3029
