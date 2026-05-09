@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松08 - 案件未跟进提醒...
call npm run dev
pause
