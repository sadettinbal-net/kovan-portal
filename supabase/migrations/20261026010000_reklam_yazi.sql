-- Reklam görselinin üstüne / yanına yazı: yazı metni, yeri, rengi ve boyutu.
-- Mevcut reklamlar etkilenmez (yazı boş kalır).
alter table public.reklamlar add column if not exists yazi text not null default '';
alter table public.reklamlar add column if not exists yazi_konum text not null default 'alt'
  check (yazi_konum in ('ust', 'orta', 'alt', 'ust_serit', 'alt_serit'));
alter table public.reklamlar add column if not exists yazi_renk text not null default 'beyaz'
  check (yazi_renk in ('beyaz', 'siyah', 'sari', 'lacivert', 'kirmizi'));
alter table public.reklamlar add column if not exists yazi_boyut text not null default 'orta'
  check (yazi_boyut in ('kucuk', 'orta', 'buyuk'));
