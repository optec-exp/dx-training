@echo off
title 作品36 - 航空用語クイズ
cd /d "%~dp0"
echo 正在启动 作品36: 航空用語クイズ...
start "" http://localhost:3036
npm run dev -- --port 3036
