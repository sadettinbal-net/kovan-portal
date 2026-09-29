-- Ümraniye Oto Sanayi Sitesi içindeki sanayi siteleri (umraniyesanayisitesi.com listesinden).
-- "Kartal Oto Sanayi Sitesi" eklenmedi: aynı adla Kartal ilçesinde kayıt var (id 30), kullanıcı netleştirecek.
insert into public.sanayi_siteleri (site_adi, il_adi, ilce_adi)
select v.site_adi, 'İSTANBUL', 'ÜMRANİYE'
from (values
  ('Fatih Sultan Mehmet Sanayi Sitesi'),
  ('Kadosan Oto Sanayi Sitesi'),
  ('Güven Sanayi Sitesi'),
  ('Bostancı Sanayi Sitesi'),
  ('Küçük Sanayi Sitesi'),
  ('Gümrükçüler Sanayi Sitesi'),
  ('Birlik Sanayi Sitesi'),
  ('Deniz Sanayi Sitesi'),
  ('Özentaş Sanayi Sitesi'),
  ('Ak Sanayi Sitesi')
) as v(site_adi)
where not exists (select 1 from public.sanayi_siteleri s where s.site_adi = v.site_adi);
