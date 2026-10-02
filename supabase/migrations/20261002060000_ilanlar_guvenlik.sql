-- İlanlar 1. aşama (güvenlik)

-- 1) İlan verenlerin e-postaları dışarıdan okunamasın: ilanlar tablosu açık anahtarla
--    okunamaz/yazılamaz (RLS politikasına dokunulmaz). Site ilanları sunucu üzerinden okur.
revoke all on public.ilanlar from anon, authenticated;

-- 2) Günlük ilan sınırı sayımı hızlı olsun
create index if not exists ilanlar_veren_tarih_idx on public.ilanlar (ilan_veren_email, created_at);

-- 3) Fotoğraf deposu: sadece JPG/PNG/WEBP, dosya başına en fazla 5 MB
--    (depo şu an boş; mevcut dosya etkilenmez)
update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'ilan-fotograflari';
