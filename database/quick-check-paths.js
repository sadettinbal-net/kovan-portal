import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Veritabanı Kontrol Ediliyor...\n');

// İlçe paths kontrol
const { data: ilcePaths, error: ilceError, count: ilceCount } = await supabase
  .from('ilce_paths')
  .select('*', { count: 'exact' })
  .limit(3);

if (ilceError) {
  console.log('❌ ilce_paths tablosu yok veya erişilemedi:', ilceError.message);
} else {
  console.log(`✅ ilce_paths tablosu: ${ilceCount || 0} kayıt`);
  if (ilcePaths && ilcePaths.length > 0) {
    console.log('   Örnek:', ilcePaths[0].il_adi, '-', ilcePaths[0].ilce_adi);
  }
}

// Mahalle paths kontrol
const { data: mahallePaths, error: mahalleError, count: mahalleCount } = await supabase
  .from('mahalle_paths')
  .select('*', { count: 'exact' })
  .limit(3);

if (mahalleError) {
  console.log('\n❌ mahalle_paths tablosu yok veya erişilemedi:', mahalleError.message);
} else {
  console.log(`\n✅ mahalle_paths tablosu: ${mahalleCount || 0} kayıt`);
  if (mahallePaths && mahallePaths.length > 0) {
    console.log('   Örnek:', mahallePaths[0].il_adi, '-', mahallePaths[0].ilce_adi, '-', mahallePaths[0].mahalle_adi);
  }
}

console.log('\n---');
console.log('💡 Sonuç: İlçe ve mahalle harita path verileri var mı kontrol edildi.');
