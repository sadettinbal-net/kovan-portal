/**
 * Kategori sistemini test eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testKategoriler() {
  console.log('🧪 KATEGORİ SİSTEMİ TEST EDİLİYOR...\n');
  console.log('='.repeat(60));

  // Ana kategorileri çek
  const { data: kategoriler, error: katError } = await supabase
    .from('kategoriler')
    .select('*')
    .order('id');

  if (katError) {
    console.error('❌ Ana kategoriler çekilemedi:', katError.message);
    console.log('\n⚠️  Lütfen önce Supabase Dashboard\'da SQL\'leri çalıştırın!');
    console.log('   Rehber: KATEGORİ_KURULUM_REHBERİ.md\n');
    return;
  }

  console.log(`\n✅ ANA KATEGORİLER: ${kategoriler?.length || 0} adet\n`);

  if (kategoriler && kategoriler.length > 0) {
    kategoriler.forEach(kat => {
      console.log(`   ${kat.icon} ${kat.kategori_adi} (${kat.renk})`);
    });
  }

  // Alt kategorileri çek
  const { data: altKategoriler, error: altError } = await supabase
    .from('alt_kategoriler')
    .select('*');

  if (altError) {
    console.error('\n❌ Alt kategoriler çekilemedi:', altError.message);
    return;
  }

  console.log(`\n✅ ALT KATEGORİLER: ${altKategoriler?.length || 0} adet\n`);

  // Her ana kategori için alt kategorileri göster
  if (kategoriler && kategoriler.length > 0) {
    for (const kat of kategoriler.slice(0, 3)) {  // İlk 3 kategori
      const alts = altKategoriler?.filter(a => a.kategori_id === kat.id) || [];
      console.log(`${kat.icon} ${kat.kategori_adi} (${alts.length} alt kategori):`);
      alts.slice(0, 5).forEach(alt => {
        console.log(`     - ${alt.alt_kategori_adi}`);
      });
      if (alts.length > 5) {
        console.log(`     ... ve ${alts.length - 5} tane daha\n`);
      } else {
        console.log('');
      }
    }
  }

  console.log('='.repeat(60));
  console.log('\n✅ KATEGORİ SİSTEMİ HAZIR!');
  console.log('\n📋 ÖZET:');
  console.log(`   Ana Kategori: ${kategoriler?.length || 0}`);
  console.log(`   Alt Kategori: ${altKategoriler?.length || 0}`);
  console.log('\n🎯 Sonraki Adım: Frontend\'e kategori seçimi ekle\n');
}

testKategoriler();
