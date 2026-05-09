@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松10 - 库存不足通知...
call npm run dev
pause
