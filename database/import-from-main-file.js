/**
 * Ana dosyadan (06_mahalle_sokak_data.sql) TÜM verileri import eder
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 500;

function parseCopyLine(line) {
  return line.split('\t');
}

async function importMahalleler() {
  console.log('📍 MAHALLELER import ediliyor (ana dosyadan)...\n');

  // Mevcut mahalle_id'leri al
  console.log('📊 Mevcut veriler kontrol ediliyor...');
  const { data: existingData } = await supabase
    .from('mahalleler')
    .select('mahalle_id')
    .not('mahalle_id', 'is', null)
    .limit(200000); // Yüksek limit

  const existingIds = new Set(existingData?.map(m => m.mahalle_id) || []);
  console.log(`   Mevcut: ${existingIds.size.toLocaleString()} mahalle\n`);

  const fileStream = fs.createReadStream('database/06_mahalle_sokak_data.sql');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let totalCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let lineCount = 0;

  let inMahalleler = false;

  for await (const line of rl) {
    if (line.startsWith('COPY public.mahalleler')) {
      inMahalleler = true;
      console.log('📖 Mahalleler bölümü okunuyor...\n');
      continue;
    }

    if (inMahalleler && line === '\\.') {
      console.log('\n✅ Mahalleler bölümü bitti');
      break;
    }

    if (!inMahalleler || !line.trim()) continue;

    lineCount++;

    const [mahalle_id, mahalle_adi, ilce_id, ilce_adi, il_id, il_adi] = parseCopyLine(line);
    const mahalleIdInt = parseInt(mahalle_id);

    if (existingIds.has(mahalleIdInt)) {
      skipCount++;
      continue;
    }

    batch.push({
      mahalle_id: mahalleIdInt,
      mahalle_adi: mahalle_adi,
      ilce_id: parseInt(ilce_id),
      ilce_adi: ilce_adi,
      il_id: parseInt(il_id),
      il_adi: il_adi
    });

    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase
        .from('mahalleler')
        .insert(batch);

      if (error) {
        if (!error.message.includes('duplicate')) {
          console.error(`  ⚠️  Hata:`, error.message.substring(0, 80));
        }
        errorCount += batch.length;
      } else {
        totalCount += batch.length;
      }

      if ((totalCount + skipCount) % 100000 === 0) {
        console.log(`  ✓ İşlenen: ${(totalCount + skipCount).toLocaleString()} | Yeni: ${totalCount.toLocaleString()} | Skip: ${skipCount.toLocaleString()}`);
      }

      batch = [];

      // Rate limit
      if (totalCount % 20000 === 0 && totalCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Kalan batch
  if (batch.length > 0) {
    const { error } = await supabase.from('mahalleler').insert(batch);
    if (!error) totalCount += batch.length;
    else errorCount += batch.length;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ MAHALLELER import tamamlandı!`);
  console.log(`   Dosyada toplam: ${lineCount.toLocaleString()}`);
  console.log(`   Yeni eklenen: ${totalCount.toLocaleString()}`);
  console.log(`   Skip: ${skipCount.toLocaleString()}`);
  console.log(`   Hata: ${errorCount.toLocaleString()}`);
  console.log(`   DB'de toplam: ${(existingIds.size + totalCount).toLocaleString()}`);
  console.log(`${'='.repeat(60)}\n`);

  return totalCount;
}

async function importSokaklar() {
  console.log('🛣️  SOKAKLAR import ediliyor (ana dosyadan)...\n');

  // Mevcut sokak_id'leri al
  console.log('📊 Mevcut veriler kontrol ediliyor...');
  const { data: existingData } = await supabase
    .from('sokaklar')
    .select('sokak_id')
    .not('sokak_id', 'is', null)
    .limit(1200000); // Yüksek limit

  const existingIds = new Set(existingData?.map(s => s.sokak_id) || []);
  console.log(`   Mevcut: ${existingIds.size.toLocaleString()} sokak\n`);

  const fileStream = fs.createReadStream('database/06_mahalle_sokak_data.sql');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let totalCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let lineCount = 0;

  let inSokaklar = false;

  for await (const line of rl) {
    if (line.startsWith('COPY public.sokaklar')) {
      inSokaklar = true;
      console.log('📖 Sokaklar bölümü okunuyor...\n');
      continue;
    }

    if (inSokaklar && line === '\\.') {
      console.log('\n✅ Sokaklar bölümü bitti');
      break;
    }

    if (!inSokaklar || !line.trim()) continue;

    lineCount++;

    const [sokak_id, sokak_adi, mahalle_id, mahalle_adi, ilce_id, ilce_adi, il_id, il_adi] = parseCopyLine(line);
    const sokakIdInt = parseInt(sokak_id);

    if (existingIds.has(sokakIdInt)) {
      skipCount++;
      continue;
    }

    batch.push({
      sokak_id: sokakIdInt,
      sokak_adi: sokak_adi,
      mahalle_id: parseInt(mahalle_id),
      mahalle_adi: mahalle_adi,
      ilce_id: parseInt(ilce_id),
      ilce_adi: ilce_adi,
      il_id: parseInt(il_id),
      il_adi: il_adi
    });

    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase
        .from('sokaklar')
        .insert(batch);

      if (error) {
        if (!error.message.includes('duplicate')) {
          console.error(`  ⚠️  Hata:`, error.message.substring(0, 80));
        }
        errorCount += batch.length;
      } else {
        totalCount += batch.length;
      }

      if ((totalCount + skipCount) % 100000 === 0) {
        console.log(`  ✓ İşlenen: ${(totalCount + skipCount).toLocaleString()} | Yeni: ${totalCount.toLocaleString()} | Skip: ${skipCount.toLocaleString()}`);
      }

      batch = [];

      // Rate limit
      if (totalCount % 20000 === 0 && totalCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Kalan batch
  if (batch.length > 0) {
    const { error } = await supabase.from('sokaklar').insert(batch);
    if (!error) totalCount += batch.length;
    else errorCount += batch.length;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ SOKAKLAR import tamamlandı!`);
  console.log(`   Dosyada toplam: ${lineCount.toLocaleString()}`);
  console.log(`   Yeni eklenen: ${totalCount.toLocaleString()}`);
  console.log(`   Skip: ${skipCount.toLocaleString()}`);
  console.log(`   Hata: ${errorCount.toLocaleString()}`);
  console.log(`   DB'de toplam: ${(existingIds.size + totalCount).toLocaleString()}`);
  console.log(`${'='.repeat(60)}`);

  return totalCount;
}

async function main() {
  console.log('🚀 TÜM TÜRKİYE mahalle ve sokak verileri import ediliyor...\n');
  console.log('📁 Dosya: database/06_mahalle_sokak_data.sql\n');

  const startTime = Date.now();

  try {
    // Önce mahalleler
    await importMahalleler();

    // Sonra sokaklar
    await importSokaklar();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Toplam süre: ${duration} saniye (${(duration / 60).toFixed(1)} dakika)`);

  } catch (error) {
    console.error('❌ Import hatası:', error);
    process.exit(1);
  }
}

main();
