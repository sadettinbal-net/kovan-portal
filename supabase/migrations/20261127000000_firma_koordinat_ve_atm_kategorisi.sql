-- 2026-11-27 (canlıya uygulandı)
-- Kesin koordinatı bilinen firmalar (ATM'ler, zincir mağazalar) için enlem/boylam.
-- Firma sayfasındaki harita, koordinat varsa doğrudan o noktayı gösterir; yoksa adresi arar.
alter table public.firmalar add column if not exists enlem double precision, add column if not exists boylam double precision;

-- FİNANS altında "ATM'ler" kategorisi
insert into public.firma_kategorileri (ad, tip, ust_kategori_id, sira, aktif)
select 'ATM''ler', 'kurumsal', 77, coalesce((select max(sira)+1 from public.firma_kategorileri where ust_kategori_id=77),1), true
where not exists (select 1 from public.firma_kategorileri where ad='ATM''ler' and ust_kategori_id=77);
