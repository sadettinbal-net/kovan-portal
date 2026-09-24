import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Mahalleler Tablosu Kontrol Ediliyor...\n');

// Birkaç örnek mahalle kaydı çek
const { data: mahalleler, error } = await supabase
  .from('mahalleler')
  .select('*')
  .limit(5);

if (error) {
  console.log('❌ Hata:', error.message);
} else {
  console.log('✅ Örnek mahalle kayıtları:');
  mahalleler?.forEach((m, idx) => {
    console.log(`\n${idx + 1}. Kayıt:`);
    console.log('  il_adi:', m.il_adi);
    console.log('  ilce_adi:', m.ilce_adi);
    console.log('  mahalle_adi:', m.mahalle_adi);
    console.log('  mahalle_id:', m.mahalle_id);
  });
}

// Tüm unique il_adi değerlerini göster
const { data: allMahalleler } = await supabase
  .from('mahalleler')
  .select('il_adi');

const uniqueIller = [...new Set(allMahalleler?.map(m => m.il_adi))].sort();
console.log('\n\n📍 Veritabanındaki tüm unique il_adi değerleri:');
console.log(uniqueIller.slice(0, 20)); // İlk 20 tanesini göster
console.log(`\nToplam: ${uniqueIller.length} farklı il_adi değeri`);
