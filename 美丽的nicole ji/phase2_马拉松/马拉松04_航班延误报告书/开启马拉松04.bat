@echo off
cd /d "%~dp0"
echo.
echo ==============================
echo  马拉松04 - 航班延误报告书
echo ==============================
echo.

echo 正在检查 Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到 Node.js，请先安装 Node.js
    echo 下载地址：https://nodejs.org
    pause
    exit /b 1
)

echo [1/2] 安装依赖（首次需要几分钟）...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo 错误：npm install 失败，请检查网络连接
    pause
    exit /b 1
)

echo.
echo [2/2] 启动开发服务器...
start "马拉松04服务器" /d "%CD%" cmd /k npm run dev

echo.
echo 等待服务器启动中（10秒）...
timeout /t 10 /nobreak > nul
start http://localhost:3000

echo.
echo 已打开浏览器 http://localhost:3000
echo 要停止服务器：关闭「马拉松04服务器」窗口 或 按 Ctrl+C
echo.
pause
