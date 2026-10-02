-- Firma fotoğraf deposu: sadece JPG/PNG/WEBP, dosya başına en fazla 5 MB.
-- Sınır sadece yeni yüklemelere uygulanır; mevcut dosyalar (ÖZNUR OTO'nun 6,29 MB'lık kartı dahil) etkilenmez.
update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'firma-fotograflari';
