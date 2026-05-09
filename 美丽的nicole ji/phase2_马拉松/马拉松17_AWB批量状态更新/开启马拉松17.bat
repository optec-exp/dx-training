@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松17 - AWB批量状态更新...
call npm run dev
pause
