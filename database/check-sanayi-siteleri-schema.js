import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Sanayi siteleri tablosundaki sütunları kontrol et
const { data, error } = await supabase
  .from('sanayi_siteleri')
  .select('*')
  .limit(1);

if (error) {
  console.log('❌ Hata:', error.message);
} else {
  console.log('📊 Sanayi Siteleri Tablo Yapısı:');
  console.log('Sütunlar:', Object.keys(data[0] || {}));
  console.log('\nİlk kayıt:', data[0]);
}
