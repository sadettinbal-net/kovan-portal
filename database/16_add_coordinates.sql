-- Dükkanlar tablosuna koordinat sütunları ekle
ALTER TABLE dukkanlar
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS adres TEXT;

-- Sanayi siteleri tablosuna koordinat sütunları ekle
ALTER TABLE sanayi_siteleri
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS adres TEXT;

-- Sokaklar tablosuna koordinat sütunları ekle (opsiyonel - sokak merkezi için)
ALTER TABLE sokaklar
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Index ekle (harita sorgularını hızlandırmak için)
CREATE INDEX IF NOT EXISTS idx_dukkanlar_coordinates ON dukkanlar(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sanayi_coordinates ON sanayi_siteleri(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sokaklar_coordinates ON sokaklar(latitude, longitude);
