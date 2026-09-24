import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 İZMİR İLÇELERİ KONTROL\n');

// İzmir'in ID'sini bul
const { data: izmirData } = await supabase
  .from('iller')
  .select('*')
  .eq('sehir_adi', 'İzmir')
  .single();

console.log('İzmir verisi:', izmirData);

if (izmirData) {
  // İzmir'in ilçelerini ara
  const { data: ilceler, error } = await supabase
    .from('ilceler')
    .select('*')
    .eq('il_id', izmirData.id);

  console.log('\nİzmir İlçeleri (ilceler tablosu):');
  console.log('Hata:', error);
  console.log('Sayı:', ilceler?.length);

  if (ilceler && ilceler.length > 0) {
    console.log('\nİlçeler:');
    ilceler.forEach(ilce => {
      console.log(`  - ${ilce.ilce_adi}`);
    });
  } else {
    console.log('\n❌ İzmir için ilçe bulunamadı!');
  }

  // Sokaklar tablosunda İzmir var mı?
  console.log('\n\n📊 Sokaklar tablosunda İzmir:');
  const { data: sokaklar } = await supabase
    .from('sokaklar')
    .select('ilce_adi')
    .eq('il_adi', 'İZMİR');

  const uniqueIlceler = [...new Set(sokaklar?.map(s => s.ilce_adi))];
  console.log(`${uniqueIlceler.length} ilçe bulundu:`);
  uniqueIlceler.forEach(ilce => {
    console.log(`  - ${ilce}`);
  });
}

// Tüm illerin ilçe sayılarını göster
console.log('\n\n📋 TÜM İLLERİN İLÇE SAYILARI:');
const { data: iller } = await supabase
  .from('iller')
  .select('*')
  .limit(10);

for (const il of iller || []) {
  const { count } = await supabase
    .from('ilceler')
    .select('*', { count: 'exact', head: true })
    .eq('il_id', il.id);

  console.log(`${il.sehir_adi}: ${count} ilçe`);
}
