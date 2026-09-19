/**
 * Duplicate mahalle ve sokak kayıtlarını temizler
 * Her mahalle_id ve sokak_id'den sadece 1 tane kalır
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicateMahalleler() {
  console.log('🔍 Duplicate mahalleler temizleniyor...\n');

  // Tüm mahalleleri al (limit artırıldı)
  const { data: allMahalleler } = await supabase
    .from('mahalleler')
    .select('*')
    .limit(500000)
    .order('id');

  console.log(`Toplam mahalle kaydı: ${allMahalleler?.length?.toLocaleString()}`);

  // mahalle_id bazında grupla, her gruptan ilk kaydı tut
  const keepIds = new Set();
  const deleteIds = new Set();
  const seen = new Map();

  allMahalleler?.forEach(m => {
    if (!seen.has(m.mahalle_id)) {
      seen.set(m.mahalle_id, m.id);
      keepIds.add(m.id);
    } else {
      deleteIds.add(m.id);
    }
  });

  console.log(`Tutulacak (unique): ${keepIds.size.toLocaleString()}`);
  console.log(`Silinecek (duplicate): ${deleteIds.size.toLocaleString()}`);

  if (deleteIds.size === 0) {
    console.log('\n✅ Duplicate mahalle yok!\n');
    return 0;
  }

  // Batch olarak sil (1000'er)
  const deleteArray = Array.from(deleteIds);
  let deletedCount = 0;

  for (let i = 0; i < deleteArray.length; i += 1000) {
    const batch = deleteArray.slice(i, i + 1000);

    const { error } = await supabase
      .from('mahalleler')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`Hata (batch ${i / 1000 + 1}):`, error.message);
    } else {
      deletedCount += batch.length;
      console.log(`  ✓ Silindi: ${deletedCount.toLocaleString()} / ${deleteIds.size.toLocaleString()}`);
    }

    // Rate limit
    if (i > 0 && i % 5000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n✅ Toplam ${deletedCount.toLocaleString()} duplicate mahalle silindi!\n`);
  return deletedCount;
}

async function removeDuplicateSokaklar() {
  console.log('🔍 Duplicate sokaklar temizleniyor...\n');

  // Tüm sokakları al (limit artırıldı)
  const { data: allSokaklar } = await supabase
    .from('sokaklar')
    .select('*')
    .limit(2000000)
    .order('id');

  console.log(`Toplam sokak kaydı: ${allSokaklar?.length?.toLocaleString()}`);

  // sokak_id bazında grupla
  const keepIds = new Set();
  const deleteIds = new Set();
  const seen = new Map();

  allSokaklar?.forEach(s => {
    if (!seen.has(s.sokak_id)) {
      seen.set(s.sokak_id, s.id);
      keepIds.add(s.id);
    } else {
      deleteIds.add(s.id);
    }
  });

  console.log(`Tutulacak (unique): ${keepIds.size.toLocaleString()}`);
  console.log(`Silinecek (duplicate): ${deleteIds.size.toLocaleString()}`);

  if (deleteIds.size === 0) {
    console.log('\n✅ Duplicate sokak yok!\n');
    return 0;
  }

  // Batch olarak sil (1000'er)
  const deleteArray = Array.from(deleteIds);
  let deletedCount = 0;

  for (let i = 0; i < deleteArray.length; i += 1000) {
    const batch = deleteArray.slice(i, i + 1000);

    const { error } = await supabase
      .from('sokaklar')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`Hata (batch ${i / 1000 + 1}):`, error.message);
    } else {
      deletedCount += batch.length;
      console.log(`  ✓ Silindi: ${deletedCount.toLocaleString()} / ${deleteIds.size.toLocaleString()}`);
    }

    // Rate limit
    if (i > 0 && i % 5000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n✅ Toplam ${deletedCount.toLocaleString()} duplicate sokak silindi!\n`);
  return deletedCount;
}

async function main() {
  console.log('🧹 DUPLICATE TEMİZLEME BAŞLIYOR...\n');
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();

  try {
    const mahalleDeleted = await removeDuplicateMahalleler();
    const sokakDeleted = await removeDuplicateSokaklar();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('='.repeat(60));
    console.log('✅ TEMİZLEME TAMAMLANDI!');
    console.log(`   Silinen mahalle: ${mahalleDeleted.toLocaleString()}`);
    console.log(`   Silinen sokak: ${sokakDeleted.toLocaleString()}`);
    console.log(`   Süre: ${duration} saniye`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

main();
