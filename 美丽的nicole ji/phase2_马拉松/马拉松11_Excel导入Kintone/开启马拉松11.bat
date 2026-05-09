@echo off
cd /d "%~dp0"
echo 安装依赖...
call npm install
echo 正在启动服务器...
start "马拉松11服务器" cmd /k npm run dev
echo 等待服务器启动中（5秒）...
timeout /t 5 /nobreak > nul
start http://localhost:3000
echo.
echo 已在浏览器中打开 http://localhost:3000
echo 关闭此窗口不会停止服务器。
echo 要停止服务器请到「马拉松11服务器」窗口按 Ctrl+C。
pause
