-- Firma sayfa sabitleme için yeni kolon
-- Supabase > SQL Editor'de çalıştırın

ALTER TABLE firmalar
  ADD COLUMN IF NOT EXISTS hedef_sayfa INTEGER DEFAULT NULL;
