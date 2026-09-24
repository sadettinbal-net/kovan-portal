import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📊 İLÇELER TABLOSU OLUŞTURMA\n');
console.log('='.repeat(60));

// 1. Mevcut ilçe tablosu var mı kontrol et
console.log('\n1️⃣ İlçeler tablosu kontrol ediliyor...');
const { data: existingIlceler, error: checkError } = await supabase
  .from('ilceler')
  .select('*')
  .limit(1);

if (checkError) {
  console.log('❌ İlçeler tablosu bulunamadı:', checkError.message);
  console.log('\n⚠️  Lütfen Supabase\'de "ilceler" tablosunu oluşturun:');
  console.log('\nTablo yapısı:');
  console.log('  - id (bigint, primary key, auto-increment)');
  console.log('  - il_id (bigint) → iller tablosuna foreign key');
  console.log('  - il_adi (text)');
  console.log('  - ilce_adi (text)');
  console.log('  - created_at (timestamp)');
  process.exit(1);
} else {
  console.log('✅ İlçeler tablosu mevcut');
}

// 2. Sokaklar tablosundan mevcut ilçeleri çek
console.log('\n2️⃣ Sokaklar tablosundan ilçeleri topluyorum...');
const { data: sokaklar } = await supabase
  .from('sokaklar')
  .select('il_adi, ilce_adi');

const ilIlceMap = new Map();

sokaklar?.forEach(s => {
  const ilAdi = s.il_adi;
  const ilceAdi = s.ilce_adi;

  if (ilAdi && ilceAdi) {
    if (!ilIlceMap.has(ilAdi)) {
      ilIlceMap.set(ilAdi, new Set());
    }
    ilIlceMap.get(ilAdi).add(ilceAdi);
  }
});

console.log(`\n✓ ${ilIlceMap.size} ilde ilçe verisi bulundu:`);
ilIlceMap.forEach((ilceler, ilAdi) => {
  console.log(`  ${ilAdi}: ${ilceler.size} ilçe`);
});

// 3. İller tablosundan il_id'leri eşleştir
console.log('\n3️⃣ İl adlarını ID\'lere eşleştiriyorum...');
const { data: iller } = await supabase
  .from('iller')
  .select('*');

const ilAdToId = new Map();
iller?.forEach(il => {
  ilAdToId.set(il.sehir_adi.toLocaleUpperCase('tr-TR'), il.id);
});

// 4. İlçeleri hazırla
console.log('\n4️⃣ İlçe kayıtları hazırlanıyor...');
const ilcelerToInsert = [];

ilIlceMap.forEach((ilceler, ilAdi) => {
  const ilId = ilAdToId.get(ilAdi.toLocaleUpperCase('tr-TR'));

  if (!ilId) {
    console.log(`⚠️  ${ilAdi} için il_id bulunamadı!`);
    return;
  }

  Array.from(ilceler).forEach(ilceAdi => {
    ilcelerToInsert.push({
      il_id: ilId,
      il_adi: ilAdi,
      ilce_adi: ilceAdi
    });
  });
});

console.log(`\n✓ ${ilcelerToInsert.length} ilçe kaydı hazırlandı`);

// 5. İlçeleri veritabanına ekle
console.log('\n5️⃣ İlçeler veritabanına ekleniyor...');

// Önce mevcut kayıtları sil (temiz başlangıç)
const { error: deleteError } = await supabase
  .from('ilceler')
  .delete()
  .neq('id', 0); // Tüm kayıtları sil

if (deleteError) {
  console.log('⚠️  Eski kayıtlar silinemedi:', deleteError.message);
}

// Yeni kayıtları ekle (batch olarak)
const batchSize = 100;
let insertedCount = 0;

for (let i = 0; i < ilcelerToInsert.length; i += batchSize) {
  const batch = ilcelerToInsert.slice(i, i + batchSize);
  const { error } = await supabase
    .from('ilceler')
    .insert(batch);

  if (error) {
    console.log(`❌ Batch ${i / batchSize + 1} hata:`, error.message);
  } else {
    insertedCount += batch.length;
    console.log(`  ✓ ${insertedCount} / ${ilcelerToInsert.length} ilçe eklendi`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n✅ TAMAMLANDI!`);
console.log(`${insertedCount} ilçe başarıyla eklendi\n`);

// Özet göster
const { count } = await supabase
  .from('ilceler')
  .select('*', { count: 'exact', head: true });

console.log(`📊 Veritabanında toplam ${count} ilçe kaydı var`);
