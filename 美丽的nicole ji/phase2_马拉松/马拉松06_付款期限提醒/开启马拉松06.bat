@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松06 - 付款期限提醒...
call npm run dev
pause
