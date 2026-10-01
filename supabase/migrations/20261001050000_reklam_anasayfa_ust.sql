-- Ana sayfa üst şerit reklam alanı: reklamlar.konum kuralına 'anasayfa_ust' eklenir.
-- Veri silinmez; sadece izin kuralı yeni değeri de kapsayacak şekilde yeniden kurulur.
alter table public.reklamlar drop constraint reklamlar_konum_check;
alter table public.reklamlar add constraint reklamlar_konum_check
  check (konum in ('video', 'sidebar', 'popup', 'anasayfa_ust'));
