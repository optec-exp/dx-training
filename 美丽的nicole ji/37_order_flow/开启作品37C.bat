@echo off
cd /d "%~dp0"
echo 正在安装依赖...
call npm install
echo 启动作品37C - 接单流程自动化...
call npm run dev
pause
