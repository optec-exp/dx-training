@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松18 - 一键报价单...
call npm run dev
pause
