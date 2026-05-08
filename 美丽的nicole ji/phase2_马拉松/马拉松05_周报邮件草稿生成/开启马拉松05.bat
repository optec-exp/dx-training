@echo off
cd /d "%~dp0"
call npm install
echo 启动马拉松05 - 周报邮件草稿生成...
call npm run dev
pause
