@echo off
title Kovan Portal - Sunucuyu Durdur
echo Arka planda calisan sunucu kapatiliyor...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*kovan-portal*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo Sunucu kapatildi.
timeout /t 3 >nul
