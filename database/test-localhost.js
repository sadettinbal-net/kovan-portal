/**
 * Localhost test için örnek veri gösterir
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('🧪 Localhost Test - Örnek Veriler\n');
  console.log('📍 http://localhost:3000 adresinde test edebilirsiniz\n');
  console.log('='.repeat(60));

  // İstanbul Pendik mahalleler
  const { data: pendikMahalleler } = await supabase
    .from('mahalleler')
    .select('mahalle_adi, mahalle_id')
    .ilike('il_adi', 'İstanbul')
    .eq('ilce_adi', 'PENDİK')
    .order('mahalle_adi')
    .limit(10);

  console.log('\n✅ İSTANBUL - PENDİK Mahalleleri (ilk 10):');
  pendikMahalleler?.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.mahalle_adi}`);
  });

  // Pendik bir mahallenin sokakları (mahalle_id ile)
  if (pendikMahalleler && pendikMahalleler.length > 0) {
    const mahalle = pendikMahalleler[0];

    const { data: sokaklar } = await supabase
      .from('sokaklar')
      .select('sokak_adi')
      .eq('mahalle_id', mahalle.mahalle_id)
      .order('sokak_adi')
      .limit(10);

    console.log(`\n✅ ${mahalle.mahalle_adi} - Sokakları (ilk 10):`);
    sokaklar?.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.sokak_adi}`);
    });

    console.log(`\n   Toplam: ${sokaklar?.length || 0} sokak gösteriliyor`);
  }

  // Tüm İstanbul ilçeleri
  const { data: istanbulIlceler } = await supabase
    .from('mahalleler')
    .select('ilce_adi')
    .eq('il_adi', 'İSTANBUL')
    .limit(1000);

  const uniqueIlceler = [...new Set(istanbulIlceler?.map(m => m.ilce_adi) || [])];

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 TEST ADIMLARI:');
  console.log('   1. Tarayıcınızda http://localhost:3000 açın');
  console.log('   2. İl: İstanbul seçin');
  console.log(`   3. İlçe seçin (Mevcut: ${uniqueIlceler.sort().join(', ')})`);
  console.log('   4. Mahalle seçin (yukarıdaki listeden)');
  console.log('   5. Sokak seçin');
  console.log('\n✨ Tüm dropdown\'lar otomatik dolu gelecek!\n');
}

test();
