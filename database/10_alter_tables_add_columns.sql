-- Mahalleler tablosuna eksik kolonları ekle
ALTER TABLE mahalleler
  ADD COLUMN IF NOT EXISTS mahalle_id INTEGER,
  ADD COLUMN IF NOT EXISTS ilce_adi VARCHAR,
  ADD COLUMN IF NOT EXISTS il_id INTEGER,
  ADD COLUMN IF NOT EXISTS il_adi VARCHAR;

-- Sokaklar tablosuna eksik kolonları ekle
ALTER TABLE sokaklar
  ADD COLUMN IF NOT EXISTS sokak_id INTEGER,
  ADD COLUMN IF NOT EXISTS mahalle_adi VARCHAR,
  ADD COLUMN IF NOT EXISTS ilce_id INTEGER,
  ADD COLUMN IF NOT EXISTS ilce_adi VARCHAR,
  ADD COLUMN IF NOT EXISTS il_id INTEGER,
  ADD COLUMN IF NOT EXISTS il_adi VARCHAR;

-- Mahalleler id'sini auto-increment'ten çıkar (manuel id kullanacağız)
-- NOT: Supabase'de bu işlemi dashboard'dan yapmanız gerekebilir

COMMENT ON COLUMN mahalleler.mahalle_id IS 'Orijinal mahalle ID (veri kaynağından)';
COMMENT ON COLUMN sokaklar.sokak_id IS 'Orijinal sokak ID (veri kaynağından)';
