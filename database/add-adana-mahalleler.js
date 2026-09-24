import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📊 ADANA MAHALLELERİNİ EKLEME\n');

// Adana'nın ID'sini al
const { data: adanaData } = await supabase
  .from('iller')
  .select('id')
  .eq('sehir_adi', 'Adana')
  .single();

const adanaId = adanaData.id;
console.log('Adana ID:', adanaId);

// Adana'nın ilçelerini al
const { data: ilceler } = await supabase
  .from('ilceler')
  .select('*')
  .eq('sehir_id', adanaId);

console.log('Adana ilçe sayısı:', ilceler?.length);

// İlçe map oluştur
const ilceMap = new Map();
ilceler?.forEach(ilce => {
  const key = ilce.ilce_adi.toLocaleUpperCase('tr-TR');
  ilceMap.set(key, ilce.id);
});

console.log('İlçe map:', Object.fromEntries(ilceMap));

// Sokaklar tablosundan Adana mahallelerini al (cursor pagination)
console.log('\nAdana sokak kayıtları çekiliyor...');
let allSokaklar = [];
let lastId = 0;
let hasMore = true;
let pageCount = 0;
const pageSize = 1000;

while (hasMore) {
  const { data: sokakPage } = await supabase
    .from('sokaklar')
    .select('id, il_adi, ilce_adi, mahalle_id, mahalle_adi')
    .eq('il_adi', 'ADANA')
    .gt('id', lastId)
    .order('id', { ascending: true })
    .limit(pageSize);

  if (sokakPage && sokakPage.length > 0) {
    allSokaklar = allSokaklar.concat(sokakPage);
    lastId = sokakPage[sokakPage.length - 1].id;
    pageCount++;

    if (pageCount % 10 === 0) {
      console.log(`  ${pageCount} sayfa işlendi - ${allSokaklar.length} kayıt toplandı`);
    }

    if (sokakPage.length < pageSize) {
      hasMore = false;
    }
  } else {
    hasMore = false;
  }
}

const sokaklar = allSokaklar;
console.log(`✅ Toplam ${sokaklar?.length} Adana sokak kaydı toplandı`);

// Unique mahalleler
const mahalleMap = new Map();
sokaklar?.forEach(s => {
  const key = `${s.ilce_adi}|${s.mahalle_id}`;
  if (!mahalleMap.has(key)) {
    mahalleMap.set(key, {
      il_adi: s.il_adi,
      ilce_adi: s.ilce_adi,
      mahalle_id: s.mahalle_id,
      mahalle_adi: s.mahalle_adi
    });
  }
});

console.log('Unique mahalle sayısı:', mahalleMap.size);

// Mahalle kayıtlarını hazırla
const mahallelerToInsert = [];
let skipped = 0;

const skippedReasons = new Map();

Array.from(mahalleMap.values()).forEach(mahalle => {
  if (!mahalle.ilce_adi) {
    skipped++;
    const key = 'null ilce_adi';
    skippedReasons.set(key, (skippedReasons.get(key) || 0) + 1);
    return;
  }

  const ilceKey = mahalle.ilce_adi.toLocaleUpperCase('tr-TR');
  const ilceId = ilceMap.get(ilceKey);

  if (!ilceId) {
    const key = `İlçe bulunamadı: ${mahalle.ilce_adi}`;
    skippedReasons.set(key, (skippedReasons.get(key) || 0) + 1);
    skipped++;
    return;
  }

  mahallelerToInsert.push({
    sehir_id: adanaId,
    il_adi: mahalle.il_adi,
    ilce_id: ilceId,
    ilce_adi: mahalle.ilce_adi,
    mahalle_id: mahalle.mahalle_id,
    mahalle_adi: mahalle.mahalle_adi
  });
});

console.log('\nEklenecek mahalle:', mahallelerToInsert.length);
console.log('Atlanan:', skipped);

if (skippedReasons.size > 0) {
  console.log('\nAtlanan kayıt detayları:');
  for (const [reason, count] of skippedReasons) {
    console.log(`  ${reason}: ${count} kayıt`);
  }
}

// Ekle
if (mahallelerToInsert.length > 0) {
  const { error } = await supabase
    .from('mahalleler_yeni')
    .insert(mahallelerToInsert);

  if (error) {
    console.log('❌ Hata:', error.message);
  } else {
    console.log('✅ Başarıyla eklendi!');
  }
}
