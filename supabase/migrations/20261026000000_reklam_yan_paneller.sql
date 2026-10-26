-- Sağ/sol reklam panelleri: reklamlar.konum kuralına ana sayfa ve detay sayfası yan alanları eklenir.
-- Veri silinmez; sadece izin kuralı yeni değerleri de kapsayacak şekilde yeniden kurulur.
alter table public.reklamlar drop constraint reklamlar_konum_check;
alter table public.reklamlar add constraint reklamlar_konum_check
  check (konum in ('video', 'sidebar', 'popup', 'anasayfa_ust', 'anasayfa_sol', 'anasayfa_sag', 'detay_sol', 'detay_sag'));
