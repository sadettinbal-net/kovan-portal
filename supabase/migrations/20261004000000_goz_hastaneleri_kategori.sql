-- Göz Hastaneleri kategorisini SAĞLIK ana kategorisi altına ekle
insert into public.firma_kategorileri (ad, tip, ust_kategori_id, sira)
select 'Göz Hastaneleri', 'kurumsal', a.id, 11
from public.firma_kategorileri a
where a.ad = 'SAĞLIK' and a.tip = 'kurumsal' and a.ust_kategori_id is null
on conflict do nothing;
