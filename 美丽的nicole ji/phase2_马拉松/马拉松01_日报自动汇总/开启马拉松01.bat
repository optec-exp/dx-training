@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松01 - 日报自动汇总...
call npm run dev
pause
