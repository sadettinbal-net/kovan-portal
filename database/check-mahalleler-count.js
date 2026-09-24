/**
 * Veritabanındaki mahalle kayıtlarını kontrol eder
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.local dosyasını yükle
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMahalleler() {
  console.log('📊 Mahalle Veritabanı Kontrol Ediliyor...\n');

  // Toplam kayıt sayısı
  const { count: totalCount, error: countError } = await supabase
    .from('mahalleler')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Hata:', countError.message);
    return;
  }

  console.log(`✅ Toplam Mahalle Kaydı: ${totalCount?.toLocaleString()}`);

  // İl bazında kayıt sayıları (İlk 10 il)
  const { data: ilStats, error: ilError } = await supabase
    .from('mahalleler')
    .select('il_adi')
    .limit(1000);

  if (!ilError && ilStats) {
    const ilCounts = {};
    ilStats.forEach(row => {
      ilCounts[row.il_adi] = (ilCounts[row.il_adi] || 0) + 1;
    });

    console.log('\n📍 İl Bazında Örnek Kayıtlar (İlk 1000 kayıttan):');
    Object.entries(ilCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([il, count]) => {
        console.log(`   ${il}: ${count.toLocaleString()}`);
      });
  }

  // Örnek kayıtlar
  const { data: samples, error: sampleError } = await supabase
    .from('mahalleler')
    .select('mahalle_id, mahalle_adi, ilce_adi, il_adi')
    .limit(5);

  if (!sampleError && samples) {
    console.log('\n📋 Örnek Kayıtlar:');
    samples.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.mahalle_adi} - ${row.ilce_adi} / ${row.il_adi}`);
    });
  }

  console.log('\n✅ Kontrol tamamlandı!');
}

checkMahalleler().catch(console.error);
