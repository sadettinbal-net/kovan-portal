/**
 * Kategori sistemini otomatik kurar - Supabase'e direkt bağlanır
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCategories() {
  console.log('🚀 KATEGORİ SİSTEMİNİ KURUYORUM...\n');
  console.log('='.repeat(60));

  // Adım 1: Tabloları oluştur
  console.log('\n📋 Adım 1: Kategoriler tablosunu oluşturuyorum...');

  const { error: createKategorilerError } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS kategoriler (
        id SERIAL PRIMARY KEY,
        kategori_adi VARCHAR(100) NOT NULL UNIQUE,
        icon VARCHAR(10),
        renk VARCHAR(20),
        sira INTEGER DEFAULT 0,
        aktif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
  });

  if (createKategorilerError) {
    console.log('⚠️  kategoriler tablosu: ', createKategorilerError.message);
  } else {
    console.log('✅ kategoriler tablosu oluşturuldu');
  }

  console.log('\n📋 Adım 2: Alt kategoriler tablosunu oluşturuyorum...');

  const { error: createAltKategorilerError } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS alt_kategoriler (
        id SERIAL PRIMARY KEY,
        kategori_id INTEGER REFERENCES kategoriler(id) ON DELETE CASCADE,
        alt_kategori_adi VARCHAR(100) NOT NULL,
        icon VARCHAR(10),
        aciklama TEXT,
        aktif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(kategori_id, alt_kategori_adi)
      )
    `
  });

  if (createAltKategorilerError) {
    console.log('⚠️  alt_kategoriler tablosu: ', createAltKategorilerError.message);
  } else {
    console.log('✅ alt_kategoriler tablosu oluşturuldu');
  }

  console.log('\n📋 Adım 3: dukkanlar tablosuna alt_kategori_id sütunu ekliyorum...');

  const { error: alterDukkanlarError } = await supabase.rpc('exec_sql', {
    sql_query: `
      ALTER TABLE dukkanlar
      ADD COLUMN IF NOT EXISTS alt_kategori_id INTEGER REFERENCES alt_kategoriler(id)
    `
  });

  if (alterDukkanlarError) {
    console.log('⚠️  alt_kategori_id sütunu: ', alterDukkanlarError.message);
  } else {
    console.log('✅ alt_kategori_id sütunu eklendi');
  }

  console.log('\n📋 Adım 4: İndeksleri oluşturuyorum...');

  await supabase.rpc('exec_sql', {
    sql_query: `CREATE INDEX IF NOT EXISTS idx_alt_kategoriler_kategori_id ON alt_kategoriler(kategori_id)`
  });

  await supabase.rpc('exec_sql', {
    sql_query: `CREATE INDEX IF NOT EXISTS idx_dukkanlar_alt_kategori_id ON dukkanlar(alt_kategori_id)`
  });

  console.log('✅ İndeksler oluşturuldu');

  // Adım 5: Ana kategorileri ekle
  console.log('\n📋 Adım 5: Ana kategorileri ekliyorum...');

  const kategoriler = [
    { id: 1, kategori_adi: 'Sağlık', icon: '🏥', renk: '#10b981', sira: 1 },
    { id: 2, kategori_adi: 'Gıda', icon: '🍔', renk: '#f59e0b', sira: 2 },
    { id: 3, kategori_adi: 'Otomotiv', icon: '🚗', renk: '#ef4444', sira: 3 },
    { id: 4, kategori_adi: 'Sanayi', icon: '🏭', renk: '#6366f1', sira: 4 },
    { id: 5, kategori_adi: 'İnşaat', icon: '🏗️', renk: '#f97316', sira: 5 },
    { id: 6, kategori_adi: 'Elektronik', icon: '💻', renk: '#3b82f6', sira: 6 },
    { id: 7, kategori_adi: 'Giyim', icon: '👔', renk: '#ec4899', sira: 7 },
    { id: 8, kategori_adi: 'Ev & Yaşam', icon: '🏠', renk: '#8b5cf6', sira: 8 },
    { id: 9, kategori_adi: 'Güzellik', icon: '💇', renk: '#f43f5e', sira: 9 },
    { id: 10, kategori_adi: 'Eğitim', icon: '📚', renk: '#14b8a6', sira: 10 },
    { id: 11, kategori_adi: 'Profesyonel', icon: '💼', renk: '#64748b', sira: 11 },
    { id: 12, kategori_adi: 'Yeme & İçme', icon: '🍕', renk: '#dc2626', sira: 12 },
    { id: 13, kategori_adi: 'Eğlence', icon: '🎮', renk: '#a855f7', sira: 13 },
    { id: 14, kategori_adi: 'Taşımacılık', icon: '🚚', renk: '#0ea5e9', sira: 14 },
    { id: 15, kategori_adi: 'Diğer', icon: '📌', renk: '#94a3b8', sira: 15 }
  ];

  for (const kat of kategoriler) {
    const { error } = await supabase
      .from('kategoriler')
      .upsert(kat, { onConflict: 'kategori_adi', ignoreDuplicates: false });

    if (error) {
      console.log(`⚠️  ${kat.kategori_adi}: ${error.message}`);
    } else {
      console.log(`✅ ${kat.icon} ${kat.kategori_adi}`);
    }
  }

  // Adım 6: Alt kategorileri ekle
  console.log('\n📋 Adım 6: Alt kategorileri ekliyorum...');

  const altKategoriler = [
    // Sağlık (9)
    { kategori_id: 1, alt_kategori_adi: 'Eczane' },
    { kategori_id: 1, alt_kategori_adi: 'Diş Kliniği' },
    { kategori_id: 1, alt_kategori_adi: 'Özel Poliklinik' },
    { kategori_id: 1, alt_kategori_adi: 'Veteriner' },
    { kategori_id: 1, alt_kategori_adi: 'Laboratuvar' },
    { kategori_id: 1, alt_kategori_adi: 'Tıbbi Malzeme' },
    { kategori_id: 1, alt_kategori_adi: 'Optik' },
    { kategori_id: 1, alt_kategori_adi: 'İşitme Cihazları' },
    { kategori_id: 1, alt_kategori_adi: 'Fizyoterapi' },

    // Gıda (12)
    { kategori_id: 2, alt_kategori_adi: 'Bakkal' },
    { kategori_id: 2, alt_kategori_adi: 'Market' },
    { kategori_id: 2, alt_kategori_adi: 'Süpermarket' },
    { kategori_id: 2, alt_kategori_adi: 'Kasap' },
    { kategori_id: 2, alt_kategori_adi: 'Manav' },
    { kategori_id: 2, alt_kategori_adi: 'Kuruyemiş' },
    { kategori_id: 2, alt_kategori_adi: 'Şarküteri' },
    { kategori_id: 2, alt_kategori_adi: 'Şekerci' },
    { kategori_id: 2, alt_kategori_adi: 'Baharatçı' },
    { kategori_id: 2, alt_kategori_adi: 'Tekel & İçki' },
    { kategori_id: 2, alt_kategori_adi: 'Toptan Gıda' },
    { kategori_id: 2, alt_kategori_adi: 'Organik Ürünler' },

    // Otomotiv (15)
    { kategori_id: 3, alt_kategori_adi: 'Oto Tamir' },
    { kategori_id: 3, alt_kategori_adi: 'Oto Elektrik' },
    { kategori_id: 3, alt_kategori_adi: 'Oto Yıkama' },
    { kategori_id: 3, alt_kategori_adi: 'Lastikçi' },
    { kategori_id: 3, alt_kategori_adi: 'Oto Boyacı' },
    { kategori_id: 3, alt_kategori_adi: 'Mekanik' },
    { kategori_id: 3, alt_kategori_adi: 'Oto Cam' },
    { kategori_id: 3, alt_kategori_adi: 'Oto Aksesuar' },
    { kategori_id: 3, alt_kategori_adi: 'Oto Ses Sistemi' },
    { kategori_id: 3, alt_kategori_adi: 'Motor Tamiri' },
    { kategori_id: 3, alt_kategori_adi: 'Klima Dolumu' },
    { kategori_id: 3, alt_kategori_adi: 'Egzoz Tamiri' },
    { kategori_id: 3, alt_kategori_adi: 'Diferansiyel' },
    { kategori_id: 3, alt_kategori_adi: 'Jant Tamiri' },
    { kategori_id: 3, alt_kategori_adi: 'Oto Döşeme' },

    // Sanayi (12)
    { kategori_id: 4, alt_kategori_adi: 'Elektrik Bobinaj' },
    { kategori_id: 4, alt_kategori_adi: 'Torna' },
    { kategori_id: 4, alt_kategori_adi: 'Kaynak' },
    { kategori_id: 4, alt_kategori_adi: 'Metal İşleme' },
    { kategori_id: 4, alt_kategori_adi: 'Boru İşleme' },
    { kategori_id: 4, alt_kategori_adi: 'Plastik Enjeksiyon' },
    { kategori_id: 4, alt_kategori_adi: 'Ahşap İşleme' },
    { kategori_id: 4, alt_kategori_adi: 'CNC İşleme' },
    { kategori_id: 4, alt_kategori_adi: 'Lazer Kesim' },
    { kategori_id: 4, alt_kategori_adi: 'Kaplama & Boya' },
    { kategori_id: 4, alt_kategori_adi: 'Döküm' },
    { kategori_id: 4, alt_kategori_adi: 'Kalıp İmalatı' },

    // İnşaat (10)
    { kategori_id: 5, alt_kategori_adi: 'Hırdavat' },
    { kategori_id: 5, alt_kategori_adi: 'Boya Badana' },
    { kategori_id: 5, alt_kategori_adi: 'Elektrik Malzemeleri' },
    { kategori_id: 5, alt_kategori_adi: 'Tesisat' },
    { kategori_id: 5, alt_kategori_adi: 'Nalburiye' },
    { kategori_id: 5, alt_kategori_adi: 'Demir Doğrama' },
    { kategori_id: 5, alt_kategori_adi: 'PVC Doğrama' },
    { kategori_id: 5, alt_kategori_adi: 'Alüminyum Doğrama' },
    { kategori_id: 5, alt_kategori_adi: 'Cam Balkon' },
    { kategori_id: 5, alt_kategori_adi: 'Isı Yalıtım' },

    // Elektronik (8)
    { kategori_id: 6, alt_kategori_adi: 'Bilgisayar Servisi' },
    { kategori_id: 6, alt_kategori_adi: 'Cep Telefonu Servisi' },
    { kategori_id: 6, alt_kategori_adi: 'Beyaz Eşya Servisi' },
    { kategori_id: 6, alt_kategori_adi: 'Elektronik Tamiri' },
    { kategori_id: 6, alt_kategori_adi: 'Oyun Konsolu' },
    { kategori_id: 6, alt_kategori_adi: 'Yazıcı & Fotokopi' },
    { kategori_id: 6, alt_kategori_adi: 'Güvenlik Sistemleri' },
    { kategori_id: 6, alt_kategori_adi: 'Uydu Sistemleri' },

    // Giyim (8)
    { kategori_id: 7, alt_kategori_adi: 'Erkek Giyim' },
    { kategori_id: 7, alt_kategori_adi: 'Kadın Giyim' },
    { kategori_id: 7, alt_kategori_adi: 'Çocuk Giyim' },
    { kategori_id: 7, alt_kategori_adi: 'Ayakkabı' },
    { kategori_id: 7, alt_kategori_adi: 'Çanta & Aksesuar' },
    { kategori_id: 7, alt_kategori_adi: 'Tuhafiye' },
    { kategori_id: 7, alt_kategori_adi: 'Terzi' },
    { kategori_id: 7, alt_kategori_adi: 'Gelinlik & Damatlık' },

    // Ev & Yaşam (9)
    { kategori_id: 8, alt_kategori_adi: 'Mobilya' },
    { kategori_id: 8, alt_kategori_adi: 'Ev Tekstili' },
    { kategori_id: 8, alt_kategori_adi: 'Züccaciye' },
    { kategori_id: 8, alt_kategori_adi: 'Hediyelik Eşya' },
    { kategori_id: 8, alt_kategori_adi: 'Kırtasiye' },
    { kategori_id: 8, alt_kategori_adi: 'Oyuncakçı' },
    { kategori_id: 8, alt_kategori_adi: 'Çiçekçi' },
    { kategori_id: 8, alt_kategori_adi: 'Halı & Kilim' },
    { kategori_id: 8, alt_kategori_adi: 'Perde & Aksesuar' },

    // Güzellik (7)
    { kategori_id: 9, alt_kategori_adi: 'Erkek Kuaförü' },
    { kategori_id: 9, alt_kategori_adi: 'Kadın Kuaförü' },
    { kategori_id: 9, alt_kategori_adi: 'Berber' },
    { kategori_id: 9, alt_kategori_adi: 'Güzellik Salonu' },
    { kategori_id: 9, alt_kategori_adi: 'Masaj & SPA' },
    { kategori_id: 9, alt_kategori_adi: 'Solaryum' },
    { kategori_id: 9, alt_kategori_adi: 'Cilt Bakımı' },

    // Eğitim (6)
    { kategori_id: 10, alt_kategori_adi: 'Dershane' },
    { kategori_id: 10, alt_kategori_adi: 'Kurs Merkezi' },
    { kategori_id: 10, alt_kategori_adi: 'Anaokulu' },
    { kategori_id: 10, alt_kategori_adi: 'Kreş' },
    { kategori_id: 10, alt_kategori_adi: 'Özel Öğretmen' },
    { kategori_id: 10, alt_kategori_adi: 'Sürücü Kursu' },

    // Profesyonel (10)
    { kategori_id: 11, alt_kategori_adi: 'Avukat' },
    { kategori_id: 11, alt_kategori_adi: 'Muhasebe & Mali Müşavir' },
    { kategori_id: 11, alt_kategori_adi: 'Danışmanlık' },
    { kategori_id: 11, alt_kategori_adi: 'Emlak' },
    { kategori_id: 11, alt_kategori_adi: 'Sigorta' },
    { kategori_id: 11, alt_kategori_adi: 'Çeviri Bürosu' },
    { kategori_id: 11, alt_kategori_adi: 'Noter' },
    { kategori_id: 11, alt_kategori_adi: 'Arabuluculuk' },
    { kategori_id: 11, alt_kategori_adi: 'Pazarlama Ajansı' },
    { kategori_id: 11, alt_kategori_adi: 'Web Tasarım' },

    // Yeme & İçme (10)
    { kategori_id: 12, alt_kategori_adi: 'Restoran' },
    { kategori_id: 12, alt_kategori_adi: 'Kafe' },
    { kategori_id: 12, alt_kategori_adi: 'Fast Food' },
    { kategori_id: 12, alt_kategori_adi: 'Çay Ocağı' },
    { kategori_id: 12, alt_kategori_adi: 'Kebapçı' },
    { kategori_id: 12, alt_kategori_adi: 'Pideci' },
    { kategori_id: 12, alt_kategori_adi: 'Pastane' },
    { kategori_id: 12, alt_kategori_adi: 'Fırın' },
    { kategori_id: 12, alt_kategori_adi: 'Tatlıcı' },
    { kategori_id: 12, alt_kategori_adi: 'Lokanta' },

    // Eğlence (6)
    { kategori_id: 13, alt_kategori_adi: 'Spor Salonu' },
    { kategori_id: 13, alt_kategori_adi: 'Yoga & Pilates' },
    { kategori_id: 13, alt_kategori_adi: 'Sinema' },
    { kategori_id: 13, alt_kategori_adi: 'Internet Kafe' },
    { kategori_id: 13, alt_kategori_adi: 'Playstation Salonu' },
    { kategori_id: 13, alt_kategori_adi: 'Bilardo Salonu' },

    // Taşımacılık (5)
    { kategori_id: 14, alt_kategori_adi: 'Kargo' },
    { kategori_id: 14, alt_kategori_adi: 'Nakliyat' },
    { kategori_id: 14, alt_kategori_adi: 'Taksi Durağı' },
    { kategori_id: 14, alt_kategori_adi: 'Minibüs Durağı' },
    { kategori_id: 14, alt_kategori_adi: 'Kurye Hizmeti' },

    // Diğer (8)
    { kategori_id: 15, alt_kategori_adi: 'Temizlik Hizmeti' },
    { kategori_id: 15, alt_kategori_adi: 'Kuru Temizleme' },
    { kategori_id: 15, alt_kategori_adi: 'Çilingir' },
    { kategori_id: 15, alt_kategori_adi: 'Anahtar' },
    { kategori_id: 15, alt_kategori_adi: 'Oto Çilingir' },
    { kategori_id: 15, alt_kategori_adi: 'Haşere İlaçlama' },
    { kategori_id: 15, alt_kategori_adi: 'Klima Montaj & Servis' },
    { kategori_id: 15, alt_kategori_adi: 'Asansör Bakım' }
  ];

  let successCount = 0;
  for (const alt of altKategoriler) {
    const { error } = await supabase
      .from('alt_kategoriler')
      .upsert(alt, { onConflict: 'kategori_id,alt_kategori_adi', ignoreDuplicates: true });

    if (!error) {
      successCount++;
    }
  }

  console.log(`✅ ${successCount} alt kategori eklendi`);

  // Özet
  console.log('\n' + '='.repeat(60));
  console.log('✅ KATEGORİ SİSTEMİ KURULDU!\n');

  const { data: katCount } = await supabase
    .from('kategoriler')
    .select('*', { count: 'exact', head: true });

  const { data: altCount } = await supabase
    .from('alt_kategoriler')
    .select('*', { count: 'exact', head: true });

  console.log('📊 ÖZET:');
  console.log(`   Ana Kategori: ${kategoriler.length}`);
  console.log(`   Alt Kategori: ${successCount}`);
  console.log('\n🎯 Sonraki Adım: node --env-file=.env.local database/test-kategoriler.js\n');
}

setupCategories().catch(err => {
  console.error('❌ Hata:', err.message);
  process.exit(1);
});
