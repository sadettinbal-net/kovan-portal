-- İstanbul'daki Sanayi Siteleri
-- Bu scripti Supabase SQL Editor'da çalıştırın

-- BAŞAKŞEHIR (İkitelli OSB)
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Başakşehir'),
  unnest(ARRAY[
    'İkitelli Organize Sanayi Bölgesi (İOSB)',
    'İkitelli OSB Metal İş Sitesi',
    'İkitelli OSB Aykosan Sanayi Sitesi',
    'İkitelli OSB Dolapdere Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'TEM Otoyolu Kuzey Yan Yol, Başakşehir',
    '15. Blok, İkitelli OSB',
    '2. Kısım, İkitelli OSB',
    '24. Ada, İkitelli OSB'
  ]);

-- TUZLA
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Tuzla'),
  unnest(ARRAY[
    'İstanbul Tuzla Organize Sanayi Bölgesi (İTOSB)',
    'Tuzla Mermerciler OSB',
    'Tuzla Kimya Sanayicileri OSB',
    'Tuzla Plus Sanayi Sitesi',
    'Tuzla Deri OSB'
  ]),
  unnest(ARRAY[
    'Aydınlı Mahallesi, Tuzla',
    'TEM Yan Yol Caddesi, Aydınlı Mahallesi, Tuzla',
    'Kimya Sanayicileri OSB, Tuzla',
    '12. Cadde No:18/40, Tuzla',
    'Deri Sanayicileri Organize Sanayi Bölgesi, Tuzla'
  ]);

-- ÜMRANİYE (Dudullu)
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Ümraniye'),
  unnest(ARRAY[
    'Dudullu Organize Sanayi Bölgesi',
    'İMES Sanayi Sitesi',
    'Yukarı Dudullu Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Baraj Yolu 2. Cad. No:7, Dudullu, Ümraniye',
    'E Blok 504 Sok. No:13, Dudullu, Ümraniye',
    'E Blok 501 Sok. No:37, Yukarı Dudullu, Ümraniye'
  ]);

-- BEYLİKDÜZÜ
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Beylikdüzü'),
  unnest(ARRAY[
    'Beylikdüzü Organize Sanayi Bölgesi (İBOSB)'
  ]),
  unnest(ARRAY[
    'E-5 Karayolu Üzeri, Beylikdüzü'
  ]);

-- KARTAL
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Kartal'),
  unnest(ARRAY[
    'Kartal Küçük Sanayi Sitesi',
    'Kartal Mobilyacılar Sitesi'
  ]),
  unnest(ARRAY[
    'Yukarı Mahalle, Kartal',
    'Mobilyacılar Sitesi, Kartal'
  ]);

-- PENDİK
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Pendik'),
  unnest(ARRAY[
    'İstanbul Anadolu Yakası OSB (İAYOSB)',
    'Pendik Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Kurtköy, Pendik',
    'Kurtköy Mahallesi, Pendik'
  ]);

-- SULTANBEYLİ
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Sultanbeyli'),
  unnest(ARRAY[
    'Sultanbeyli Küçük Sanayi Sitesi',
    'Sultanbeyli Mobilyacılar Sitesi'
  ]),
  unnest(ARRAY[
    'Necip Fazıl Mahallesi, Sultanbeyli',
    'Mobilyacılar Sitesi, Sultanbeyli'
  ]);

-- SANCAKTEPE
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Sancaktepe'),
  unnest(ARRAY[
    'Sancaktepe Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Samandıra Mahallesi, Sancaktepe'
  ]);

-- BÜYÜKÇEKMECE
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Büyükçekmece'),
  unnest(ARRAY[
    'Büyükçekmece Küçük Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Mimarsinan Mahallesi, Büyükçekmece'
  ]);

-- SİLİVRİ
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Silivri'),
  unnest(ARRAY[
    'Silivri Küçük Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Sanayi Mahallesi, Silivri'
  ]);

-- ÇATALCA
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Çatalca'),
  unnest(ARRAY[
    'Çatalca Küçük Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Ferhatpaşa Mahallesi, Çatalca'
  ]);

-- SULTANGAZİ
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Sultangazi'),
  unnest(ARRAY[
    'Sultangazi Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Cebeci Mahallesi, Sultangazi'
  ]);

-- ESENYURT
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Esenyurt'),
  unnest(ARRAY[
    'Esenyurt Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Kıraç Mahallesi, Esenyurt'
  ]);

-- AVCILAR
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Avcılar'),
  unnest(ARRAY[
    'Avcılar Küçük Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Gümüşpala Mahallesi, Avcılar'
  ]);

-- BAĞCILAR
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Bağcılar'),
  unnest(ARRAY[
    'Bağcılar Sanayi Sitesi',
    'Bağcılar Merter Sanayi Bölgesi'
  ]),
  unnest(ARRAY[
    'Yıldıztepe Mahallesi, Bağcılar',
    'Merter Keresteciler Sitesi, Bağcılar'
  ]);

-- GAZİOSMANPAŞA
INSERT INTO sanayi_siteleri (sehir_id, ilce_id, site_adi, adres)
SELECT
  (SELECT id FROM iller WHERE sehir_adi = 'İstanbul'),
  (SELECT id FROM ilceler WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul') AND ilce_adi = 'Gaziosmanpaşa'),
  unnest(ARRAY[
    'Gaziosmanpaşa Sanayi Sitesi'
  ]),
  unnest(ARRAY[
    'Karadeniz Mahallesi, Gaziosmanpaşa'
  ]);

-- Kontrol
SELECT
    'İstanbul toplam sanayi sitesi sayısı: ' || COUNT(*) as sonuc
FROM sanayi_siteleri
WHERE sehir_id = (SELECT id FROM iller WHERE sehir_adi = 'İstanbul');
