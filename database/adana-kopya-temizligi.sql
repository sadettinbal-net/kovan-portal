-- ADANA KOPYA TEMİZLİĞİ (29.09.2026)
-- Supabase > SQL Editor'a yapıştırıp Run'a basın.
--
-- Kontrol sonuçları:
--   * sokaklar: Adana'daki her sokak 2 kez kayıtlı (68.760 satır, 34.380 gerçek sokak).
--     Kopyalar birebir aynı (aynı sokak_id, isim, mahalle, ilçe).
--   * mahalleler_yeni: Adana'daki 674 mahalle 5'er kez kayıtlı (3.528 satır, 832 gerçek mahalle).
--     Kopyalar birebir aynı.
--   * Mahalle-sokak eşleşmesi: tüm sokaklar var olan bir mahalleye bağlı, mahalle adları ve
--     ilçeleri tutuyor. Düzeltilecek yanlış eşleşme bulunmadı.
--
-- Her sokak_id / mahalle_id için en eski kayıt tutulur, kopyalar silinir.
-- Dükkanlar sokak_id ile, sokaklar mahalle_id ile bağlı olduğu için hiçbir bağlantı kopmaz.

begin;

delete from sokaklar
where id in (
  select id from (
    select id, row_number() over (partition by sokak_id order by id) as sira
    from sokaklar
    where il_adi ilike 'adana'
  ) x
  where sira > 1
);

delete from mahalleler_yeni
where id in (
  select id from (
    select id, row_number() over (partition by mahalle_id order by id) as sira
    from mahalleler_yeni
    where il_adi = 'ADANA'
  ) x
  where sira > 1
);

-- İlçe adındaki yazım hatası: "Karaİsalı" -> "Karaisalı"
update ilceler set ilce_adi = 'Karaisalı' where id = 3384 and ilce_adi = 'Karaİsalı';

commit;

-- Sonuç kontrolü: 34380 / 34380 / 832 / 832 çıkmalı
select
  (select count(*) from sokaklar where il_adi ilike 'adana') as sokak_satiri,
  (select count(distinct sokak_id) from sokaklar where il_adi ilike 'adana') as tekil_sokak,
  (select count(*) from mahalleler_yeni where il_adi = 'ADANA') as mahalle_satiri,
  (select count(distinct mahalle_id) from mahalleler_yeni where il_adi = 'ADANA') as tekil_mahalle;
