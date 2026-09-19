-- Sanayi siteleri tablosuna ilce_adi sütunu ekle
ALTER TABLE sanayi_siteleri
ADD COLUMN IF NOT EXISTS ilce_adi VARCHAR(100);

-- İlçe adlarını doldur (ilce_id'den)
UPDATE sanayi_siteleri ss
SET ilce_adi = (
  SELECT DISTINCT ilce_adi
  FROM mahalleler
  WHERE mahalleler.ilce_id = ss.ilce_id
  LIMIT 1
)
WHERE ilce_adi IS NULL;
