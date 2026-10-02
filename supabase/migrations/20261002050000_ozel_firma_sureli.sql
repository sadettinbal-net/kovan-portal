-- Özel Firma (ücretli, süreli): başlangıç ve bitiş tarihi. Sadece yeni, boş sütunlar ekler.
alter table public.firmalar
  add column if not exists ozel_baslangic timestamptz,
  add column if not exists ozel_bitis timestamptz,
  add constraint firmalar_ozel_tarih_sirasi
    check (ozel_baslangic is null or ozel_bitis is null or ozel_bitis > ozel_baslangic);

-- Süresi devam eden özel firmaları hızlı bulmak için
create index if not exists firmalar_ozel_bitis_idx on public.firmalar (ozel_bitis) where ozel_firma;

-- Mevcut 7 özel firma (kullanıcı kararı b): bugünden 2026-12-31 23:59'a (Türkiye saati) kadar
update public.firmalar
  set ozel_baslangic = now(), ozel_bitis = '2026-12-31 23:59:59+03'
  where ozel_firma;
