@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松19 - 会议记录整理...
call npm run dev
pause
