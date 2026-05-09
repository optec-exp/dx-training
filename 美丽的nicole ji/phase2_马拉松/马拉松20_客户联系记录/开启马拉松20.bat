@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松20 - 客户联系记录...
call npm run dev
pause
