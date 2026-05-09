@echo off
cd /d "%~dp0"
echo 安装依赖（含 xlsx）...
call npm install
echo 启动马拉松11 - Excel导入Kintone...
call npm run dev
pause
