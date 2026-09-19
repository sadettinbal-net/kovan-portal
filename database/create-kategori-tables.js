/**
 * Kategori tabloları oluşturma - Supabase Dashboard'da SQL Editor'dan çalıştırın
 */

console.log(`
════════════════════════════════════════════════════════════════
📋 KATEGORİ TABLOLARI OLUŞTURMA
════════════════════════════════════════════════════════════════

Supabase projenizde şu adımları izleyin:

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden "SQL Editor" sekmesine tıklayın
4. "New Query" butonuna tıklayın
5. Aşağıdaki SQL'i kopyalayıp yapıştırın:

────────────────────────────────────────────────────────────────
-- KATEGORİ SİSTEMİ TABLOLARI

-- 1. Ana Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS kategoriler (
  id SERIAL PRIMARY KEY,
  kategori_adi VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(10),
  renk VARCHAR(20),
  sira INTEGER DEFAULT 0,
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

-- 3. dukkanlar Tablosuna Sütun Ekle
ALTER TABLE dukkanlar
ADD COLUMN IF NOT EXISTS alt_kategori_id INTEGER REFERENCES alt_kategoriler(id);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_alt_kategoriler_kategori_id
  ON alt_kategoriler(kategori_id);
CREATE INDEX IF NOT EXISTS idx_dukkanlar_alt_kategori_id
  ON dukkanlar(alt_kategori_id);
────────────────────────────────────────────────────────────────

6. "Run" butonuna tıklayın
7. Başarılı mesajını görünce bu script'i tekrar çalıştırın

════════════════════════════════════════════════════════════════
`);

// Kullanıcıdan onay iste
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nTabloları Supabase Dashboard\'da oluşturdunuz mu? (e/h): ', async (answer) => {
  if (answer.toLowerCase() === 'e') {
    console.log('\n✅ Harika! Şimdi kategori verilerini import edebiliriz.');
    console.log('   Komut: node --env-file=.env.local database/import-kategoriler.js\n');
  } else {
    console.log('\n⚠️  Önce Supabase Dashboard\'da SQL\'i çalıştırın, sonra tekrar deneyin.\n');
  }
  rl.close();
  process.exit(0);
});
