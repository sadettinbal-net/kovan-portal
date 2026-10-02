-- Eski firma-resimleri deposu: "giriş yapan her üye kendi klasörüne resim yükleyebilir" kuralı kaldırılır.
-- Depodaki 5 dosyaya dokunulmaz; dosyalar görüntülenmeye devam eder.
drop policy "uye kendi klasorune firma resmi yukler" on storage.objects;
