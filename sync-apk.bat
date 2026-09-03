@echo off
title Money-Honey APK Auto-Synchronizer
cls
echo ====================================================
echo   MONEY-HONEY AUTOMATIC LOCAL APK UPDATER
echo ====================================================
echo.
echo Fetching the latest compiled Android APK directly to your local folder...
echo.

node "%~dp0scripts\sync-apk.js"

echo.
echo ====================================================
echo   Press any key to close this window.
echo ====================================================
pause >nul
