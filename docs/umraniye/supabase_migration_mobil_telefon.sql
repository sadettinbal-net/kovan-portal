-- Mobil telefon kolonu ekle
ALTER TABLE firmalar ADD COLUMN IF NOT EXISTS mobil_telefon TEXT;

-- Mevcut telefon alanındaki 05 ile başlayan mobil numaraları mobil_telefon'a aktar
UPDATE firmalar
SET
  mobil_telefon = (
    SELECT STRING_AGG(TRIM(part), ', ')
    FROM unnest(string_to_array(telefon, ',')) AS part
    WHERE TRIM(part) ~ '^05'
  ),
  telefon = NULLIF(
    (
      SELECT STRING_AGG(TRIM(part), ', ')
      FROM unnest(string_to_array(telefon, ',')) AS part
      WHERE TRIM(part) !~ '^05' AND TRIM(part) != ''
    ),
    ''
  )
WHERE mobil_telefon IS NULL
  AND telefon IS NOT NULL
  AND telefon != ''
  AND EXISTS (
    SELECT 1 FROM unnest(string_to_array(telefon, ',')) AS part
    WHERE TRIM(part) ~ '^05'
  );
