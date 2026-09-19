-- =====================================================
-- KATEGORİ SİSTEMİ TABLOLARI
-- =====================================================

-- 1. Ana Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS kategoriler (
  id SERIAL PRIMARY KEY,
  kategori_adi VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(10),          -- Emoji (🏥, 🍔, 🚗, vb.)
  renk VARCHAR(20),          -- Hex renk kodu (#10b981)
  sira INTEGER DEFAULT 0,    -- Görüntülenme sırası
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Alt Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS alt_kategoriler (
  id SERIAL PRIMARY KEY,
  kategori_id INTEGER REFERENCES kategoriler(id) ON DELETE CASCADE,
  alt_kategori_adi VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(kategori_id, alt_kategori_adi)
);

-- 3. dukkanlar Tablosuna Yeni Sütun Ekle
ALTER TABLE dukkanlar
ADD COLUMN IF NOT EXISTS alt_kategori_id INTEGER REFERENCES alt_kategoriler(id);

-- İndeksler (Performans için)
CREATE INDEX IF NOT EXISTS idx_alt_kategoriler_kategori_id ON alt_kategoriler(kategori_id);
CREATE INDEX IF NOT EXISTS idx_dukkanlar_alt_kategori_id ON dukkanlar(alt_kategori_id);

-- Yorumlar
COMMENT ON TABLE kategoriler IS 'Ana kategori tablosu (Sağlık, Gıda, Otomotiv, vb.)';
COMMENT ON TABLE alt_kategoriler IS 'Alt kategori tablosu (Eczane, Bakkal, Oto Elektrik, vb.)';
COMMENT ON COLUMN dukkanlar.alt_kategori_id IS 'İşletmenin alt kategorisi';
