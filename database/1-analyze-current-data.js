import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📊 VERİTABANI ANALİZ RAPORU\n');
console.log('='.repeat(60));

// İller tablosu
const { data: iller, count: ilCount } = await supabase
  .from('iller')
  .select('*', { count: 'exact' });

console.log('\n1. İLLER TABLOSU:');
console.log(`   Toplam: ${ilCount} il`);
if (iller?.[0]) {
  console.log('   Kolonlar:', Object.keys(iller[0]));
  console.log('   Örnek:', iller[0]);
}

// Sokaklar tablosu
const { count: sokakCount } = await supabase
  .from('sokaklar')
  .select('*', { count: 'exact', head: true });

const { data: sokakSample } = await supabase
  .from('sokaklar')
  .select('*')
  .limit(1);

console.log('\n2. SOKAKLAR TABLOSU:');
console.log(`   Toplam: ${sokakCount} sokak`);
if (sokakSample?.[0]) {
  console.log('   Kolonlar:', Object.keys(sokakSample[0]));
  console.log('   Örnek:', sokakSample[0]);
}

// Sokaklar tablosundan unique istatistikler
const { data: allSokaklar } = await supabase
  .from('sokaklar')
  .select('il_adi, ilce_adi, mahalle_id');

const uniqueIller = new Set();
const uniqueIlceler = new Set();
const uniqueMahalleler = new Set();

allSokaklar?.forEach(s => {
  if (s.il_adi) uniqueIller.add(s.il_adi);
  if (s.ilce_adi) uniqueIlceler.add(s.ilce_adi);
  if (s.mahalle_id) uniqueMahalleler.add(s.mahalle_id);
});

console.log('\n   Unique İstatistikler (sokaklar tablosundan):');
console.log(`   - ${uniqueIller.size} farklı il`);
console.log(`   - ${uniqueIlceler.size} farklı ilçe`);
console.log(`   - ${uniqueMahalleler.size} farklı mahalle`);

// Mahalleler tablosu
const { count: mahalleCount } = await supabase
  .from('mahalleler')
  .select('*', { count: 'exact', head: true });

const { data: mahalleSample } = await supabase
  .from('mahalleler')
  .select('*')
  .limit(1);

console.log('\n3. MAHALLELER TABLOSU:');
console.log(`   Toplam: ${mahalleCount} kayıt`);
if (mahalleSample?.[0]) {
  console.log('   Kolonlar:', Object.keys(mahalleSample[0]));
  console.log('   Örnek:', mahalleSample[0]);
  console.log('   ⚠️  NOT: Bu tablonun yapısı YANLIŞ (kolonlar kaymış)');
}

// Dükkanlar
const { count: dukkanCount } = await supabase
  .from('dukkanlar')
  .select('*', { count: 'exact', head: true });

console.log('\n4. DÜKKANLAR TABLOSU:');
console.log(`   Toplam: ${dukkanCount} işletme`);

console.log('\n' + '='.repeat(60));
console.log('\n📋 ÖZET:');
console.log(`✓ ${ilCount} il tanımlı (iller tablosunda)`);
console.log(`✓ ${sokakCount} sokak kaydı var`);
console.log(`✓ ${uniqueIller.size} ilde veri var (sokaklar tablosunda)`);
console.log(`✓ ${uniqueIlceler.size} ilçede veri var`);
console.log(`✓ ${uniqueMahalleler.size} mahallede veri var`);
console.log(`✓ ${dukkanCount} işletme kaydı var`);
console.log(`⚠️  mahalleler tablosu KULLANILMAYACAK (yanlış yapı)`);
