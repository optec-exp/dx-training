@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松13 - Kintone跨App复制...
call npm run dev
pause
