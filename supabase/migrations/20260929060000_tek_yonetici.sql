-- Tek yönetici: sadettinbal@gmail.com. Liste src/lib/admin.ts ile aynı olmalı.
drop policy if exists "onayli firmalar herkese acik, sahibi ve yonetici hepsini gorur" on public.firmalar;
create policy "onayli firmalar herkese acik, sahibi ve yonetici hepsini gorur" on public.firmalar
  for select using (
    onay_durumu = 'onaylandi'
    or kullanici_email = (select auth.jwt() ->> 'email')
    or (select auth.jwt() ->> 'email') = 'sadettinbal@gmail.com'
  );

drop policy if exists "onayli ilanlar herkese acik, sahibi ve yonetici hepsini gorur" on public.ilanlar;
create policy "onayli ilanlar herkese acik, sahibi ve yonetici hepsini gorur" on public.ilanlar
  for select using (
    onay_durumu = 'onaylandi'
    or ilan_veren_email = (select auth.jwt() ->> 'email')
    or (select auth.jwt() ->> 'email') = 'sadettinbal@gmail.com'
  );
