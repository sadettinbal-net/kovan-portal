/**
 * Mevcut veritabanı yapısını kontrol eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
  console.log('🔍 MEVCUT VERİTABANI YAPISI\n');
  console.log('='.repeat(60));

  // Sanayi siteleri
  const { data: siteler, count: siteCount } = await supabase
    .from('sanayi_siteleri')
    .select('*', { count: 'exact' })
    .limit(3);

  console.log('\n📍 SANAYI SİTELERİ:');
  console.log(`   Toplam: ${siteCount} adet`);
  if (siteler && siteler.length > 0) {
    console.log('   Örnek yapı:');
    console.log(JSON.stringify(siteler[0], null, 2));
  }

  // Dükkanlar
  const { data: dukkanlar, count: dukkanCount } = await supabase
    .from('dukkanlar')
    .select('*', { count: 'exact' })
    .limit(3);

  console.log('\n🏪 DÜKKANLAR:');
  console.log(`   Toplam: ${dukkanCount} adet`);
  if (dukkanlar && dukkanlar.length > 0) {
    console.log('   Örnek yapı:');
    console.log(JSON.stringify(dukkanlar[0], null, 2));

    // Mevcut kategoriler
    const { data: allDukkanlar } = await supabase
      .from('dukkanlar')
      .select('kategori')
      .limit(1000);

    const uniqueKategoriler = [...new Set(allDukkanlar?.map(d => d.kategori) || [])];
    console.log(`\n   Mevcut Kategoriler (${uniqueKategoriler.length} adet):`);
    uniqueKategoriler.slice(0, 20).forEach(k => {
      console.log(`     - ${k}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

checkStructure();
