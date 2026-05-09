@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松07 - SLA违规检测...
call npm run dev
pause
