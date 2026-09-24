import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 VERİTABANI YAPIYI DÜZELTİYORUZ...\n');
console.log('Bu işlem mahalleler tablosundaki verileri');
console.log('doğru kolonlara eşleyerek sokaklar tablosuna taşıyacak.\n');

// Önce mahalleler tablosundan örnek veri al
console.log('📋 Adım 1: Mevcut veriyi analiz et...');
const { data: sample } = await supabase
  .from('mahalleler')
  .select('*')
  .limit(5);

console.log('Mahalleler tablosundan örnek 5 kayıt:');
sample?.forEach((m, idx) => {
  console.log(`\n${idx + 1}.`);
  console.log('  il_adi:', m.il_adi, '→ Gerçekte: İLÇE ADI');
  console.log('  ilce_adi:', m.ilce_adi, '→ Gerçekte: MAHALLE ADI');
  console.log('  mahalle_adi:', m.mahalle_adi, '→ Gerçekte: SOKAK ADI');
  console.log('  mahalle_id:', m.mahalle_id, '→ Gerçekte: SOKAK ID');
});

console.log('\n\n⚠️  UYARI: mahalleler tablosunda:');
console.log('- il_adi kolonu → gerçekte ilçe adı');
console.log('- ilce_adi kolonu → gerçekte mahalle adı');
console.log('- mahalle_adi kolonu → gerçekte sokak adı');
console.log('- mahalle_id kolonu → gerçekte sokak ID');

console.log('\n\n💡 ÇÖZ ÜM:');
console.log('Bu tablo doğrudan KULLANILMAYACAK.');
console.log('Bunun yerine SOKAKLAR tablosunu kullanacağız.');
console.log('Sokaklar tablosu zaten doğru yapıda.');

console.log('\n\n✅ Sokaklar tablosu yapısı:');
const { data: sokakSample } = await supabase
  .from('sokaklar')
  .select('*')
  .limit(1);

if (sokakSample?.[0]) {
  console.log('Kolonlar:', Object.keys(sokakSample[0]));
  console.log('\nÖrnek kayıt:');
  console.log('  il_adi:', sokakSample[0].il_adi);
  console.log('  ilce_adi:', sokakSample[0].ilce_adi);
  console.log('  mahalle_adi:', sokakSample[0].mahalle_adi);
  console.log('  sokak_adi:', sokakSample[0].sokak_adi);
}

console.log('\n\n📊 Sokaklar tablosundaki veri kapsam:');
const { data: allSokaklar } = await supabase
  .from('sokaklar')
  .select('il_adi, ilce_adi, mahalle_id');

const stats = {
  iller: new Set(),
  ilceler: new Set(),
  mahalleler: new Set()
};

allSokaklar?.forEach(s => {
  if (s.il_adi) stats.iller.add(s.il_adi);
  if (s.ilce_adi) stats.ilceler.add(s.ilce_adi);
  if (s.mahalle_id) stats.mahalleler.add(s.mahalle_id);
});

console.log(`  ${stats.iller.size} il: ${Array.from(stats.iller).join(', ')}`);
console.log(`  ${stats.ilceler.size} ilçe`);
console.log(`  ${stats.mahalleler.size} mahalle`);

console.log('\n\n🎯 SONUÇ:');
console.log('Kod zaten sokaklar tablosunu kullanacak şekilde güncellenmiştir.');
console.log('İlave veri yüklemesi gerekmektedir.');
