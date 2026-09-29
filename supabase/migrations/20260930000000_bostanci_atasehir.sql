-- Bostancı Oto Sanayi Sitesi Ataşehir'de (İçerenköy); Ümraniye rehberinde listeleniyor ama Ümraniye'de değil.
update public.sanayi_siteleri set ilce_adi = 'ATAŞEHİR'
where site_adi = 'Bostancı Sanayi Sitesi' and il_adi = 'İSTANBUL';

update public.firmalar set ilce_adi = 'Ataşehir'
where sanayi_sitesi = 'Bostancı Sanayi Sitesi' and il_adi = 'İstanbul';
