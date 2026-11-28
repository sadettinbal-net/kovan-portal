-- Anasayfadaki toplam işletme sayacı: anon rolünde RLS yüzünden count tam tablo taraması yapıp
-- zaman aşımına uğruyordu (sayaç 0 görünüyordu). İndeks kullanan hızlı sayım fonksiyonu.
create or replace function public.onayli_firma_sayisi()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.firmalar where onay_durumu = 'onaylandi';
$$;
revoke all on function public.onayli_firma_sayisi() from public;
grant execute on function public.onayli_firma_sayisi() to anon, authenticated, service_role;
