-- Firmayı yayından kaldırmak için 'pasif' durumu (geri alınabilir). RLS politikalarına dokunmaz.
-- Eski kuralı kaldırıp yenisini eklemek tek ifadede yapılır: biri başarısız olursa ikisi de geri alınır.
alter table public.firmalar
  drop constraint firmalar_onay_durumu_check,
  add constraint firmalar_onay_durumu_check
    check (onay_durumu in ('beklemede', 'onaylandi', 'reddedildi', 'pasif'));
