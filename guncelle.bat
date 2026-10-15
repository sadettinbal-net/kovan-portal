@echo off
title Kovan Portal - GitHub'dan guncelle
cd /d "%~dp0"
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set BR=%%b
echo Dal: %BR%
echo GitHub'daki son hal aliniyor...
git fetch origin
git merge --ff-only origin/%BR%
if errorlevel 1 (
  echo.
  echo Otomatik guncellenemedi. Bu pencerenin ekran goruntusunu Claude'a gonderin.
  pause
  exit /b
)
echo.
echo Guncellendi. Sunucu yeniden baslatiliyor...
start "" wscript "%~dp0sunucu-arkaplan.vbs"
git log -1 --oneline
echo.
pause
