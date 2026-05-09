@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 启动马拉松16 - 邮件模板填充...
call npm run dev
pause
