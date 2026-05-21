@echo off
chcp 65001 >nul
title 月度利润分配系统

cd /d "%~dp0"

echo ================================================
echo   月度利润自动分配系统
echo ================================================
echo.
echo 正在启动服务...
echo.

start "" "http://localhost:3000"

echo 浏览器即将自动打开 http://localhost:3000
echo.
echo 关闭此窗口可停止服务（或按 Ctrl+C）
echo ================================================
echo.

npm run start
