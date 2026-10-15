@echo off
title Kovan Portal - GitHub'a kaydet
cd /d "%~dp0"
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set BR=%%b
echo Dal: %BR%
echo.
echo 1) GitHub'daki son hal aliniyor (dosyalariniza dokunulmaz)...
git fetch origin
git reset --mixed origin/%BR%
echo.
echo 2) Degisiklikler kaydediliyor...
git add -A
git commit -m "Kayit %date% %time:~0,5%"
echo.
echo 3) GitHub'a gonderiliyor...
git push origin %BR%
echo.
echo ---- Son durum ----
git status -sb
git log -1 --oneline
echo.
pause
