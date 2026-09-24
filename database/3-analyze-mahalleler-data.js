import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 MAHALLELER TABLOSU İÇİNDEKİ VERİYİ ANALİZ EDİYORUZ...\n');

// Tüm unique il_adi değerlerini al (bunlar gerçekte ilçe adları)
console.log('📊 Adım 1: Unique ilçe adlarını bul...');
const { data: allData } = await supabase
  .from('mahalleler')
  .select('il_adi, il_id');

const ilceMap = new Map();
allData?.forEach(row => {
  const ilceAdi = row.il_adi;
  const ilId = row.il_id;
  if (ilceAdi && ilId) {
    if (!ilceMap.has(ilceAdi)) {
      ilceMap.set(ilceAdi, new Set());
    }
    ilceMap.get(ilceAdi).add(ilId);
  }
});

console.log(`Toplam ${ilceMap.size} unique ilçe adı bulundu\n`);

// İl ID'lerden il adlarını bul
console.log('📊 Adım 2: İl ID\'lerden il adlarını eşleştir...');
const { data: iller } = await supabase
  .from('iller')
  .select('*');

const ilIdToName = new Map();
iller?.forEach(il => {
  ilIdToName.set(il.id, il.sehir_adi);
});

// Her ilçenin hangi ile ait olduğunu göster
console.log('\n📋 İlçe → İl Eşleştirmesi:\n');

const ilIlceMap = new Map();

ilceMap.forEach((ilIds, ilceAdi) => {
  const ilIdArray = Array.from(ilIds);
  if (ilIdArray.length === 1) {
    const ilId = ilIdArray[0];
    const ilAdi = ilIdToName.get(ilId) || `Bilinmeyen (ID: ${ilId})`;

    if (!ilIlceMap.has(ilAdi)) {
      ilIlceMap.set(ilAdi, []);
    }
    ilIlceMap.get(ilAdi).push(ilceAdi);
  } else {
    console.log(`⚠️  ${ilceAdi} → Birden fazla il ID: ${ilIdArray.join(', ')}`);
  }
});

// İl bazında ilçeleri göster
console.log('\n📍 İL BAZINDA İLÇE LİSTESİ:\n');
const sortedIller = Array.from(ilIlceMap.keys()).sort();

for (const ilAdi of sortedIller) {
  const ilceler = ilIlceMap.get(ilAdi);
  console.log(`${ilAdi}: ${ilceler.length} ilçe`);
  ilceler.forEach(ilce => {
    console.log(`  - ${ilce}`);
  });
  console.log('');
}

console.log('\n📊 TOPLAM İSTATİSTİK:');
console.log(`${ilIlceMap.size} ilde veri var`);
let toplamIlce = 0;
ilIlceMap.forEach(ilceler => toplamIlce += ilceler.length);
console.log(`Toplam ${toplamIlce} ilçe`);

// Örnek bir il için detaylı analiz
console.log('\n\n🔬 DETAYLI ANALİZ - Örnek: İlk il');
const ornekIl = sortedIller[0];
console.log(`İl: ${ornekIl}`);

const { data: ornekData } = await supabase
  .from('mahalleler')
  .select('*')
  .eq('il_id', Array.from(iller.find(i => i.sehir_adi === ornekIl) ? [iller.find(i => i.sehir_adi === ornekIl).id] : [])[0])
  .limit(3);

console.log('\nÖrnek 3 kayıt:');
ornekData?.forEach((row, idx) => {
  console.log(`\n${idx + 1}.`);
  console.log(`  il_id: ${row.il_id} → İl: ${ornekIl}`);
  console.log(`  il_adi: ${row.il_adi} → Gerçekte İLÇE: ${row.il_adi}`);
  console.log(`  ilce_id: ${row.ilce_id}`);
  console.log(`  ilce_adi: ${row.ilce_adi} → Gerçekte MAHALLE: ${row.ilce_adi}`);
  console.log(`  mahalle_id: ${row.mahalle_id} → Gerçekte SOKAK ID`);
  console.log(`  mahalle_adi: ${row.mahalle_adi} → Gerçekte SOKAK: ${row.mahalle_adi}`);
});
