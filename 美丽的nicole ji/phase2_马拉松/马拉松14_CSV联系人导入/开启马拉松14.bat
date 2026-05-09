@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松14 - CSV联系人导入...
call npm run dev
pause
