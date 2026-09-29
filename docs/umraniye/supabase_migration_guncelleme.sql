-- Firma güncelleme onay sistemi için yeni kolonlar
-- Supabase > SQL Editor'de çalıştırın

ALTER TABLE firmalar
  ADD COLUMN IF NOT EXISTS bekleyen_degisiklikler JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS guncelleme_talep_tarihi TIMESTAMPTZ DEFAULT NULL;
