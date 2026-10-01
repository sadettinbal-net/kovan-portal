-- Mevcut firmaları sektor yazısına göre firma_kategorileri'ne bağlar.
-- Sadece kategori_id ve firma_tipi doldurulur; sektor yazısına dokunulmaz. Sadece kategori_id boş olanlara uygulanır.

-- 1) Birebir aynı yazılı Sanayi Sitesi kategorileri
update public.firmalar f set kategori_id = k.id, firma_tipi = 'siteli'
from public.firma_kategorileri k
where f.kategori_id is null and k.tip = 'sanayi_sitesi' and k.ust_kategori_id is null and k.ad = f.sektor;

-- 2) ÇAĞ OCAĞI yazım hatası -> ÇAY OCAĞI kategorisi
update public.firmalar f set kategori_id = k.id, firma_tipi = 'siteli'
from public.firma_kategorileri k
where f.kategori_id is null and f.sektor = 'SOSYAL TESİSLER(LOKANTA,ÇAĞ OCAĞI,BÜFE)'
  and k.tip = 'sanayi_sitesi' and k.ust_kategori_id is null and k.ad = 'SOSYAL TESİSLER(LOKANTA,ÇAY OCAĞI,BÜFE)';

-- 3) 3 hastane (Çakmak Erdem, Atlas, Çamlıca Erdem) -> Kurumsal > SAĞLIK > Hastaneler
update public.firmalar f set kategori_id = alt.id, firma_tipi = 'kurumsal'
from public.firma_kategorileri alt join public.firma_kategorileri ana on ana.id = alt.ust_kategori_id
where f.kategori_id is null and f.sektor = 'SAĞLIK HİZMETLERİ' and f.id in (5411, 5412, 5413)
  and ana.tip = 'kurumsal' and ana.ad = 'SAĞLIK' and alt.ad = 'Hastaneler';
