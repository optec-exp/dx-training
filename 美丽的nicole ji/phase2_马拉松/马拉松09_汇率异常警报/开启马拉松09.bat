@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松09 - 汇率异常警报...
call npm run dev
pause
