-- Firmalar sayfası ve Özel Firmalar sayfası için sağ/sol 3'er reklam paneli alanları
alter table public.reklamlar drop constraint if exists reklamlar_konum_check;
alter table public.reklamlar add constraint reklamlar_konum_check check (konum = any (array['video','sidebar','popup','anasayfa_ust','anasayfa_sol','anasayfa_sag','detay_sol','detay_sag','site_sol','site_sag','tip_sol','tip_sag','firmalar_sol','firmalar_sag','ozel_sol','ozel_sag']::text[]));
