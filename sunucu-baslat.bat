@echo off
title Kovan Portal - Sunucu
cd /d "%~dp0"
echo Eski sunucu kapatiliyor...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*kovan-portal*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo Sunucu baslatiliyor, tarayici birazdan acilacak...
echo (Bu pencereyi kapatirsaniz site de kapanir.)
start "" cmd /c "timeout /t 10 >nul & start http://localhost:3000"
npm run dev
pause