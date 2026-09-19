/**
 * Import edilen verileri test eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testData() {
  console.log('🧪 Veri testi başlıyor...\n');

  // İller
  const { data: iller, error: err1 } = await supabase
    .from('iller')
    .select('*')
    .limit(5);

  console.log('📍 İller (ilk 5):');
  iller?.forEach(il => console.log(`   ${il.il_id} - ${il.il_adi}`));

  // İlçeler
  const { data: ilceler, error: err2 } = await supabase
    .from('ilceler')
    .select('*')
    .eq('il_id', 34)
    .limit(5);

  console.log('\n📍 İstanbul İlçeleri (ilk 5):');
  ilceler?.forEach(ilce => console.log(`   ${ilce.ilce_id} - ${ilce.ilce_adi}`));

  // Mahalleler
  const { count: mahalleCount } = await supabase
    .from('mahalleler')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📍 Toplam Mahalle Sayısı: ${mahalleCount?.toLocaleString()}`);

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('*')
    .eq('il_adi', 'İSTANBUL')
    .limit(5);

  console.log('\n📍 İstanbul Mahalleleri (ilk 5):');
  mahalleler?.forEach(m => console.log(`   ${m.mahalle_adi} - ${m.ilce_adi}`));

  // Sokaklar
  const { count: sokakCount } = await supabase
    .from('sokaklar')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🛣️  Toplam Sokak Sayısı: ${sokakCount?.toLocaleString()}`);

  const { data: sokaklar } = await supabase
    .from('sokaklar')
    .select('*')
    .eq('il_adi', 'İSTANBUL')
    .limit(5);

  console.log('\n🛣️  İstanbul Sokakları (ilk 5):');
  sokaklar?.forEach(s => console.log(`   ${s.sokak_adi} - ${s.mahalle_adi}, ${s.ilce_adi}`));

  // Özet
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Tamamlandı!');
  console.log(`   İl: 81`);
  console.log(`   İlçe: 970+`);
  console.log(`   Mahalle: ${mahalleCount?.toLocaleString()}`);
  console.log(`   Sokak: ${sokakCount?.toLocaleString()}`);
  console.log('='.repeat(60));
}

testData();
