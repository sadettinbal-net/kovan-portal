/**
 * İlçe paths tablosunu kontrol eder
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIlcePaths() {
  console.log('📊 İlçe Paths Kontrol Ediliyor...\n');

  // Tablo var mı kontrol et
  const { data, error, count } = await supabase
    .from('ilce_paths')
    .select('*', { count: 'exact', head: false })
    .limit(5);

  if (error) {
    console.error('❌ Hata:', error.message);
    console.log('\n💡 İlçe paths tablosu henüz oluşturulmamış olabilir.');
    console.log('   İlçe sınırlarını göstermek için bu tabloyu oluşturmalıyız.');
    return null;
  }

  console.log(`✅ Toplam İlçe Path: ${count?.toLocaleString()}`);

  if (data && data.length > 0) {
    console.log('\n📋 Örnek İlçe Paths:');
    data.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.ilce_adi} (${row.il_adi}) - Path uzunluğu: ${row.path_data?.length || 0} karakter`);
    });
  }

  return count;
}

checkIlcePaths().catch(console.error);
