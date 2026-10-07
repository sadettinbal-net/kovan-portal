-- Kategori resmi (fotograf_url) olan ama ana sayfa resmi olmayan firmaların
-- ana sayfa resmini kategori resmine eşitle

UPDATE firmalar
SET ana_sayfa_resim = fotograf_url
WHERE fotograf_url IS NOT NULL
  AND (ana_sayfa_resim IS NULL OR ana_sayfa_resim = '');

-- İstatistik: Kaç kayıt güncellendi
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Güncellenen firma sayısı: %', updated_count;
END $$;
