-- Firma Talepleri Tablosu
-- Bu tablo, kullanıcıların firma ekleme taleplerini saklar
-- Yönetici onayından sonra veriler 'dukkanlar' tablosuna aktarılır

CREATE TABLE IF NOT EXISTS firma_talepleri (
  id SERIAL PRIMARY KEY,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dukkan_adi VARCHAR(255) NOT NULL,
  usta_adi VARCHAR(255),
  telefon VARCHAR(50),
  cep_telefonu VARCHAR(50),
  whatsapp VARCHAR(50),
  site_id INTEGER REFERENCES sanayi_siteleri(id) ON DELETE SET NULL,
  mahalle_id INTEGER REFERENCES mahalleler(id) ON DELETE SET NULL,
  sokak_id INTEGER REFERENCES sokaklar(id) ON DELETE SET NULL,
  blok_no VARCHAR(50),
  web_sitesi VARCHAR(255),
  alt_kategori_id INTEGER REFERENCES alt_kategoriler(id) ON DELETE SET NULL,
  durum VARCHAR(20) DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'onaylandi', 'reddedildi')),
  yonetici_notu TEXT,
  olusturulma_tarihi TIMESTAMP DEFAULT NOW(),
  guncelleme_tarihi TIMESTAMP DEFAULT NOW(),
  onaylayan_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  onay_tarihi TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_firma_talepleri_kullanici ON firma_talepleri(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_firma_talepleri_durum ON firma_talepleri(durum);
CREATE INDEX IF NOT EXISTS idx_firma_talepleri_olusturulma ON firma_talepleri(olusturulma_tarihi DESC);

-- RLS (Row Level Security) politikaları
ALTER TABLE firma_talepleri ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi taleplerini görebilir
CREATE POLICY "Kullanıcılar kendi taleplerini görebilir"
  ON firma_talepleri
  FOR SELECT
  USING (auth.uid() = kullanici_id);

-- Kullanıcılar yeni talep oluşturabilir
CREATE POLICY "Kullanıcılar talep oluşturabilir"
  ON firma_talepleri
  FOR INSERT
  WITH CHECK (auth.uid() = kullanici_id);

-- Kullanıcılar kendi taleplerini güncelleyebilir (sadece beklemedeyse)
CREATE POLICY "Kullanıcılar kendi bekleyen taleplerini güncelleyebilir"
  ON firma_talepleri
  FOR UPDATE
  USING (auth.uid() = kullanici_id AND durum = 'beklemede')
  WITH CHECK (auth.uid() = kullanici_id AND durum = 'beklemede');

-- Admin her şeyi görebilir ve değiştirebilir (Bu politika admin kontrolü ile yapılacak)

-- Güncelleme tarihi trigger'ı
CREATE OR REPLACE FUNCTION update_firma_talepleri_guncelleme_tarihi()
RETURNS TRIGGER AS $$
BEGIN
  NEW.guncelleme_tarihi = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_firma_talepleri_guncelleme
  BEFORE UPDATE ON firma_talepleri
  FOR EACH ROW
  EXECUTE FUNCTION update_firma_talepleri_guncelleme_tarihi();
