' Kovan Portal - siteyi pencere acmadan arka planda baslatir.
' Cift tiklayin; yaklasik 10 saniye sonra tarayicida http://localhost:3000 acilir.
' Kapatmak icin: sunucu-durdur.bat
' Site acilmazsa hata kayitlari: sunucu.log

Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
sh.CurrentDirectory = fso.GetParentFolderName(WScript.ScriptFullName)

' Eski sunucu acik kaldiysa kapat
sh.Run "powershell -NoProfile -Command ""Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*kovan-portal*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }""", 0, True

' Sunucuyu gizli pencerede baslat, ciktiyi sunucu.log dosyasina yaz
sh.Run "cmd /c npm run dev > sunucu.log 2>&1", 0, False

WScript.Sleep 10000
sh.Run "http://localhost:3000"
