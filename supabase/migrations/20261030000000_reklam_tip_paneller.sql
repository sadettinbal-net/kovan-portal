-- Sanayi dışı / Kurumsal firmalar sayfası (sağ menüden bir kategori seçilince) sağ ve sol 3'er reklam paneli
alter table public.reklamlar drop constraint reklamlar_konum_check;
alter table public.reklamlar add constraint reklamlar_konum_check
  check (konum in ('video', 'sidebar', 'popup', 'anasayfa_ust', 'anasayfa_sol', 'anasayfa_sag', 'detay_sol', 'detay_sag', 'site_sol', 'site_sag', 'tip_sol', 'tip_sag'));
