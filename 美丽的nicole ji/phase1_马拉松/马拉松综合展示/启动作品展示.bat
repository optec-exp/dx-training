@echo off
title 马拉松综合展示 - Nicole Ji
echo.
echo  ==============================
echo   马拉松综合展示 正在启动...
echo  ==============================
echo.
echo  启动后请在浏览器打开：
echo  http://localhost:3099
echo.

cd /d "%~dp0"
start "" "http://localhost:3099"
npm run dev
pause
