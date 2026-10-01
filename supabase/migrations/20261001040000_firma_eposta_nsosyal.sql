-- Firma iletişim e-postası ve N Sosyal hesabı (Firma Ekle formu). Sadece yeni, boş sütun ekler.
alter table public.firmalar
  add column if not exists eposta text,
  add column if not exists nsosyal text;
