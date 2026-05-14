-- İstanbul'daki Sanayi Siteleri
-- Bu scripti Supabase SQL Editor'da çalıştırın

-- BAŞAKŞEHIR (İkitelli OSB)
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Başakşehir'),
  unnest(ARRAY[
    'İkitelli Organize Sanayi Bölgesi (İOSB)',
    'İkitelli OSB Metal İş Sitesi',
    'İkitelli OSB Aykosan Sanayi Sitesi',
    'İkitelli OSB Dolapdere Sanayi Sitesi'
  ]);

-- TUZLA
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Tuzla'),
  unnest(ARRAY[
    'İstanbul Tuzla Organize Sanayi Bölgesi (İTOSB)',
    'Tuzla Mermerciler OSB',
    'Tuzla Kimya Sanayicileri OSB',
    'Tuzla Plus Sanayi Sitesi',
    'Tuzla Deri OSB'
  ]);

-- ÜMRANİYE (Dudullu)
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Ümraniye'),
  unnest(ARRAY[
    'Dudullu Organize Sanayi Bölgesi',
    'İMES Sanayi Sitesi',
    'Yukarı Dudullu Sanayi Sitesi'
  ]);

-- BEYLİKDÜZÜ
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Beylikdüzü'),
  unnest(ARRAY[
    'Beylikdüzü Organize Sanayi Bölgesi (İBOSB)'
  ]);

-- KARTAL
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Kartal'),
  unnest(ARRAY[
    'Kartal Küçük Sanayi Sitesi',
    'Kartal Mobilyacılar Sitesi'
  ]);

-- PENDİK
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Pendik'),
  unnest(ARRAY[
    'İstanbul Anadolu Yakası OSB (İAYOSB)',
    'Pendik Sanayi Sitesi'
  ]);

-- SULTANBEYLİ
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Sultanbeyli'),
  unnest(ARRAY[
    'Sultanbeyli Küçük Sanayi Sitesi',
    'Sultanbeyli Mobilyacılar Sitesi'
  ]);

-- SANCAKTEPE
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Sancaktepe'),
  unnest(ARRAY[
    'Sancaktepe Sanayi Sitesi'
  ]);

-- BÜYÜKÇEKMECE
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Büyükçekmece'),
  unnest(ARRAY[
    'Büyükçekmece Küçük Sanayi Sitesi'
  ]);

-- SİLİVRİ
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Silivri'),
  unnest(ARRAY[
    'Silivri Küçük Sanayi Sitesi'
  ]);

-- ÇATALCA
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Çatalca'),
  unnest(ARRAY[
    'Çatalca Küçük Sanayi Sitesi'
  ]);

-- SULTANGAZİ
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Sultangazi'),
  unnest(ARRAY[
    'Sultangazi Sanayi Sitesi'
  ]);

-- ESENYURT
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Esenyurt'),
  unnest(ARRAY[
    'Esenyurt Sanayi Sitesi'
  ]);

-- AVCILAR
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Avcılar'),
  unnest(ARRAY[
    'Avcılar Küçük Sanayi Sitesi'
  ]);

-- BAĞCILAR
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Bağcılar'),
  unnest(ARRAY[
    'Bağcılar Sanayi Sitesi',
    'Bağcılar Merter Sanayi Bölgesi'
  ]);

-- GAZİOSMANPAŞA
INSERT INTO sanayi_siteleri (ilce_id, site_adi)
SELECT
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Gaziosmanpaşa'),
  unnest(ARRAY[
    'Gaziosmanpaşa Sanayi Sitesi'
  ]);

-- Kontrol
SELECT
    'İstanbul toplam sanayi sitesi sayısı: ' || COUNT(*) as sonuc
FROM sanayi_siteleri
WHERE ilce_id IN (
  SELECT id FROM ilceler
  WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul')
);
