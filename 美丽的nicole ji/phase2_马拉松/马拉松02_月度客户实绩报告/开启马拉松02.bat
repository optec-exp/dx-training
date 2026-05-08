@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松02 - 月度客户实绩报告...
call npm run dev
pause
