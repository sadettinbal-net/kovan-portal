import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📊 MAHALLELER_YENI TABLOSU OLUŞTURMA\n');
console.log('='.repeat(60));

// 1. Tablo kontrolü
console.log('\n1️⃣ mahalleler_yeni tablosu kontrol ediliyor...');
const { data: existingTable, error: checkError } = await supabase
  .from('mahalleler_yeni')
  .select('*')
  .limit(1);

if (checkError) {
  console.log('❌ mahalleler_yeni tablosu bulunamadı:', checkError.message);
  console.log('\n⚠️  Lütfen Supabase\'de "mahalleler_yeni" tablosunu oluşturun:');
  console.log('\nTablo yapısı:');
  console.log('  - id (bigint, primary key, auto-increment)');
  console.log('  - sehir_id (bigint) → iller tablosuna foreign key');
  console.log('  - il_adi (text)');
  console.log('  - ilce_id (bigint) → ilceler tablosuna foreign key');
  console.log('  - ilce_adi (text)');
  console.log('  - mahalle_id (bigint) → unique mahalle identifier');
  console.log('  - mahalle_adi (text)');
  console.log('  - created_at (timestamp)');
  process.exit(1);
} else {
  console.log('✅ mahalleler_yeni tablosu mevcut');
}

// 2. Sokaklar tablosundan unique mahalleleri topla
console.log('\n2️⃣ Sokaklar tablosundan unique mahalleler toplanıyor...');

// Toplam kayıt sayısını al
const { count: toplamSokak } = await supabase
  .from('sokaklar')
  .select('*', { count: 'exact', head: true });

console.log(`  Toplam sokak kaydı: ${toplamSokak || 'bilinmiyor'}`);

// Tüm sokakları sayfalama ile al
let allSokaklar = [];
const pageSize = 1000;
let page = 0;
let hasMore = true;

while (hasMore) {
  const { data: sokakPage } = await supabase
    .from('sokaklar')
    .select('il_adi, ilce_adi, mahalle_id, mahalle_adi')
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (sokakPage && sokakPage.length > 0) {
    allSokaklar = allSokaklar.concat(sokakPage);
    console.log(`  Sayfa ${page + 1}: ${sokakPage.length} kayıt (Toplam: ${allSokaklar.length})`);
    page++;

    if (sokakPage.length < pageSize) {
      hasMore = false;
    }
  } else {
    hasMore = false;
  }
}

const sokaklar = allSokaklar;
console.log(`  ${sokaklar?.length} sokak kaydı toplandı`);

// Unique mahalle kombinasyonlarını topla
const mahalleMap = new Map();

sokaklar?.forEach(s => {
  const key = `${s.il_adi}|${s.ilce_adi}|${s.mahalle_id}`;

  if (!mahalleMap.has(key)) {
    mahalleMap.set(key, {
      il_adi: s.il_adi,
      ilce_adi: s.ilce_adi,
      mahalle_id: s.mahalle_id,
      mahalle_adi: s.mahalle_adi
    });
  }
});

console.log(`  ${mahalleMap.size} unique mahalle bulundu`);

// 3. İl ve ilçe ID'lerini eşleştir
console.log('\n3️⃣ İl ve ilçe ID\'leri eşleştiriliyor...');

const { data: iller } = await supabase
  .from('iller')
  .select('*');

const ilAdToId = new Map();
iller?.forEach(il => {
  ilAdToId.set(il.sehir_adi.toLocaleUpperCase('tr-TR'), il.id);
});

const { data: ilceler } = await supabase
  .from('ilceler')
  .select('*');

// İl ve ilçe adı kombinasyonundan ilçe ID'sini bul
const ilceKeyToId = new Map();
ilceler?.forEach(ilce => {
  const normalizedIlceAdi = ilce.ilce_adi.toLocaleUpperCase('tr-TR');
  const key = `${ilce.sehir_id}|${normalizedIlceAdi}`;
  ilceKeyToId.set(key, ilce.id);
});

// 4. Mahalle kayıtlarını hazırla
console.log('\n4️⃣ Mahalle kayıtları hazırlanıyor...');
const mahallelerToInsert = [];
let skippedCount = 0;

Array.from(mahalleMap.values()).forEach(mahalle => {
  const sehirId = ilAdToId.get(mahalle.il_adi.toLocaleUpperCase('tr-TR'));

  if (!sehirId) {
    skippedCount++;
    return;
  }

  const ilceKey = `${sehirId}|${mahalle.ilce_adi.toLocaleUpperCase('tr-TR')}`;
  const ilceId = ilceKeyToId.get(ilceKey);

  if (!ilceId) {
    skippedCount++;
    return;
  }

  mahallelerToInsert.push({
    sehir_id: sehirId,
    il_adi: mahalle.il_adi,
    ilce_id: ilceId,
    ilce_adi: mahalle.ilce_adi,
    mahalle_id: mahalle.mahalle_id,
    mahalle_adi: mahalle.mahalle_adi
  });
});

console.log(`  ${mahallelerToInsert.length} mahalle kaydı hazırlandı`);
console.log(`  ${skippedCount} kayıt atlandı (il/ilçe eşleşmesi bulunamadı)`);

// 5. Veritabanına ekle
console.log('\n5️⃣ Mahalleler veritabanına ekleniyor...');

// Önce mevcut kayıtları sil
const { error: deleteError } = await supabase
  .from('mahalleler_yeni')
  .delete()
  .neq('id', 0);

if (deleteError) {
  console.log('⚠️  Eski kayıtlar silinemedi:', deleteError.message);
}

// Batch olarak ekle
const batchSize = 100;
let insertedCount = 0;

for (let i = 0; i < mahallelerToInsert.length; i += batchSize) {
  const batch = mahallelerToInsert.slice(i, i + batchSize);
  const { error } = await supabase
    .from('mahalleler_yeni')
    .insert(batch);

  if (error) {
    console.log(`❌ Batch ${Math.floor(i / batchSize) + 1} hata:`, error.message);
  } else {
    insertedCount += batch.length;
    console.log(`  ✓ ${insertedCount} / ${mahallelerToInsert.length} mahalle eklendi`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n✅ TAMAMLANDI!`);
console.log(`${insertedCount} mahalle başarıyla eklendi\n`);

// İstatistikler
const { count } = await supabase
  .from('mahalleler_yeni')
  .select('*', { count: 'exact', head: true });

console.log(`📊 Veritabanında toplam ${count} mahalle kaydı var`);

// İl bazında özet
console.log('\n📍 İl bazında mahalle sayıları:');
const ilMahalleStats = new Map();

Array.from(mahalleMap.values()).forEach(m => {
  if (!ilMahalleStats.has(m.il_adi)) {
    ilMahalleStats.set(m.il_adi, 0);
  }
  ilMahalleStats.set(m.il_adi, ilMahalleStats.get(m.il_adi) + 1);
});

const sortedStats = Array.from(ilMahalleStats.entries()).sort((a, b) => b[1] - a[1]);
sortedStats.forEach(([il, count]) => {
  console.log(`  ${il}: ${count} mahalle`);
});
