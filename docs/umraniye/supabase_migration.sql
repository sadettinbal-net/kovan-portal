-- ─────────────────────────────────────────────
-- İlanlar tablosu (ilan-ekle özelliği için)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ilanlar (
  id               BIGSERIAL PRIMARY KEY,
  baslik           TEXT NOT NULL,
  aciklama         TEXT NOT NULL,
  fiyat            TEXT,
  kategori         TEXT NOT NULL,
  telefon          TEXT NOT NULL,
  ilan_veren_ad    TEXT NOT NULL,
  ilan_veren_email TEXT,
  fotograflar      TEXT[] DEFAULT '{}',
  onay_durumu      TEXT NOT NULL DEFAULT 'beklemede',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ilanlar_onay_durumu_idx ON ilanlar(onay_durumu);
CREATE INDEX IF NOT EXISTS ilanlar_created_at_idx  ON ilanlar(created_at DESC);

-- Storage bucket: ilan-fotograflari
-- (Supabase Dashboard > Storage'dan manuel olarak oluşturun: "ilan-fotograflari", Public)

-- ─────────────────────────────────────────────
-- Ziyaretçi takip tablosu
CREATE TABLE IF NOT EXISTS ziyaretler (
  id        BIGSERIAL PRIMARY KEY,
  sayfa     TEXT NOT NULL,
  firma_id  INT REFERENCES firmalar(id) ON DELETE SET NULL,
  referrer  TEXT,
  cihaz     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ziyaretler_created_at ON ziyaretler(created_at);
CREATE INDEX IF NOT EXISTS idx_ziyaretler_firma_id   ON ziyaretler(firma_id);

-- Cihaz kolonu mevcut tabloya ekle (yeni kurulumda gerek yok)
ALTER TABLE ziyaretler ADD COLUMN IF NOT EXISTS cihaz TEXT;

-- Firmalar tablosuna web sitesi, açıklama ve sosyal medya alanları ekleme
ALTER TABLE firmalar
  ADD COLUMN IF NOT EXISTS aciklama TEXT,
  ADD COLUMN IF NOT EXISTS web_sitesi TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS facebook TEXT,
  ADD COLUMN IF NOT EXISTS twitter TEXT,
  ADD COLUMN IF NOT EXISTS youtube TEXT,
  ADD COLUMN IF NOT EXISTS linkedin TEXT;

-- Yorum ve puan sistemi
CREATE TABLE IF NOT EXISTS yorumlar (
  id              BIGSERIAL PRIMARY KEY,
  firma_id        INT NOT NULL REFERENCES firmalar(id) ON DELETE CASCADE,
  kullanici_email TEXT NOT NULL,
  kullanici_ad    TEXT NOT NULL DEFAULT '',
  yorum           TEXT NOT NULL,
  puan            INT NOT NULL CHECK (puan BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS yorumlar_firma_id_idx ON yorumlar(firma_id);
-- Her kullanıcı bir firmayı yalnızca bir kez değerlendirebilir
CREATE UNIQUE INDEX IF NOT EXISTS yorumlar_unique_user_firma ON yorumlar(firma_id, kullanici_email);
