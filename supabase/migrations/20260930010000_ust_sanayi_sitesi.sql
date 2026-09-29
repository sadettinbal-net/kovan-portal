-- Sanayi sitelerinde üst/alt ilişkisi: bir sanayi sitesi başka bir sitenin içinde olabilir.
alter table public.sanayi_siteleri
  add column if not exists ust_site_id integer references public.sanayi_siteleri(id) on delete set null;

-- Ümraniye Oto Sanayi Sitesi'nin içindeki 9 site (Kartal Oto ve Bostancı hariç; onlar başka ilçelerde)
update public.sanayi_siteleri
set ust_site_id = (select id from public.sanayi_siteleri where site_adi = 'Ümraniye Oto Sanayi Sitesi' and ilce_adi = 'ÜMRANİYE' limit 1)
where il_adi = 'İSTANBUL' and ilce_adi = 'ÜMRANİYE' and site_adi in (
  'Fatih Sultan Mehmet Sanayi Sitesi', 'Kadosan Oto Sanayi Sitesi', 'Güven Sanayi Sitesi', 'Küçük Sanayi Sitesi',
  'Gümrükçüler Sanayi Sitesi', 'Birlik Sanayi Sitesi', 'Deniz Sanayi Sitesi', 'Özentaş Sanayi Sitesi', 'Ak Sanayi Sitesi'
);

-- İlçe adı yazımı tutarlı olsun (tablodaki diğer kayıtlar gibi büyük harf)
update public.sanayi_siteleri set ilce_adi = 'ÜMRANİYE' where il_adi = 'İSTANBUL' and ilce_adi = 'Ümraniye';

notify pgrst, 'reload schema';
