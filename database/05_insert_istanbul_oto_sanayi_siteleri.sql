-- İstanbul Oto Sanayi Siteleri
-- Bu scripti Supabase SQL Editor'da çalıştırın

-- KARTAL - Oto Sanayi Siteleri
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Kartal'),
  unnest(ARRAY[
    'Kartal Oto Sanayi Sitesi',
    'Kartal Küçük Oto Sanayi Sitesi'
  ]);

-- ÜMRANİYE - Oto Sanayi Siteleri
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Ümraniye'),
  unnest(ARRAY[
    'Ümraniye Oto Sanayi Sitesi',
    'Şerifali Oto Sanayi Sitesi'
  ]);

-- TUZLA - Oto Sanayi Siteleri
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Tuzla'),
  unnest(ARRAY[
    'Tuzla Oto Sanayi Sitesi',
    'Aydıntepe Küçük Oto Sanayi Sitesi'
  ]);

-- MALTEPE - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Maltepe'),
  unnest(ARRAY[
    'Maltepe Oto Sanayi Sitesi'
  ]);

-- PENDİK - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Pendik'),
  unnest(ARRAY[
    'Pendik Oto Sanayi Sitesi',
    'Kurtköy Oto Sanayi Sitesi'
  ]);

-- KADIKÖY - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Kadıköy'),
  unnest(ARRAY[
    'Kadıköy Oto Sanayi Sitesi'
  ]);

-- ŞİŞLİ - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Şişli'),
  unnest(ARRAY[
    'Şişli Oto Sanayi Sitesi'
  ]);

-- SARIYER - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Sarıyer'),
  unnest(ARRAY[
    'Sarıyer Oto Sanayi Sitesi',
    'Maslak Oto Sanayi Sitesi'
  ]);

-- BAŞAKŞEHIR - Oto Sanayi Sitesi (İkitelli Bölgesi)
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Başakşehir'),
  unnest(ARRAY[
    'İkitelli Oto Sanayi Sitesi'
  ]);

-- BAĞCILAR - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Bağcılar'),
  unnest(ARRAY[
    'Bağcılar Oto Sanayi Sitesi',
    'Güneşli Oto Sanayi Sitesi'
  ]);

-- AVCILAR - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Avcılar'),
  unnest(ARRAY[
    'Avcılar Oto Sanayi Sitesi'
  ]);

-- BEYLİKDÜZÜ - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Beylikdüzü'),
  unnest(ARRAY[
    'Beylikdüzü Oto Sanayi Sitesi'
  ]);

-- ESENYURT - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Esenyurt'),
  unnest(ARRAY[
    'Esenyurt Oto Sanayi Sitesi'
  ]);

-- BÜYÜKÇEKMECE - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Büyükçekmece'),
  unnest(ARRAY[
    'Büyükçekmece Oto Sanayi Sitesi'
  ]);

-- SULTANBEYLİ - Oto Sanayi Sitesi
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Sultanbeyli'),
  unnest(ARRAY[
    'Sultanbeyli Oto Sanayi Sitesi'
  ]);

-- Kontrol
SELECT
    'İstanbul oto sanayi sitesi sayısı: ' || COUNT(*) as sonuc
FROM sanayi_siteleri
WHERE site_adi LIKE '%Oto%'
AND ilce_id IN (
  SELECT id FROM ilceler
  WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul')
);
