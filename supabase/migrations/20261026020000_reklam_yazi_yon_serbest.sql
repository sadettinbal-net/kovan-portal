-- Reklam yazısı: yazı yönü (yatay / yukarıdan aşağı / aşağıdan yukarı) ve serbest yerleştirme.
-- yazi_x / yazi_y: "serbest" yerleşimde yazı bandının ortasının resim üzerindeki yeri (yüzde, 0-100).
alter table public.reklamlar add column if not exists yazi_yon text not null default 'yatay'
  check (yazi_yon in ('yatay', 'yukaridan_asagi', 'asagidan_yukari'));
alter table public.reklamlar add column if not exists yazi_x real not null default 50 check (yazi_x between 0 and 100);
alter table public.reklamlar add column if not exists yazi_y real not null default 50 check (yazi_y between 0 and 100);
-- yazi_aci: yazının döndürme açısı (derece); yazi_yay: yay eğriliği (0 düz, + yukarı kavis, - aşağı kavis)
alter table public.reklamlar add column if not exists yazi_aci smallint not null default 0 check (yazi_aci between -180 and 180);
alter table public.reklamlar add column if not exists yazi_yay smallint not null default 0 check (yazi_yay between -100 and 100);
alter table public.reklamlar drop constraint if exists reklamlar_yazi_konum_check;
alter table public.reklamlar add constraint reklamlar_yazi_konum_check
  check (yazi_konum in ('ust', 'orta', 'alt', 'ust_serit', 'alt_serit', 'serbest'));
