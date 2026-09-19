/**
 * Kalan mahalle verilerini import eder (duplicate skip)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 200; // Küçük batch (rate limit için)

function parseCopyLine(line) {
  return line.split('\t');
}

async function importMahalleler() {
  console.log('📍 Kalan mahalle verileri import ediliyor...\n');

  const fileStream = fs.createReadStream('database/08_import_mahalleler.sql');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let totalCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  let inData = false;

  for await (const line of rl) {
    if (line.startsWith('COPY public.mahalleler')) {
      inData = true;
      continue;
    }

    if (line === '\\.') {
      break;
    }

    if (!inData || !line.trim()) continue;

    const [mahalle_id, mahalle_adi, ilce_id, ilce_adi, il_id, il_adi] = parseCopyLine(line);

    batch.push({
      mahalle_id: parseInt(mahalle_id),
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
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          skipCount += batch.length;
        } else {
          console.error(`  ⚠️  Hata (${totalCount}):`, error.message.substring(0, 80));
          errorCount += batch.length;
        }
      } else {
        totalCount += batch.length;
      }

      if ((totalCount + skipCount + errorCount) % 10000 === 0) {
        console.log(`  ✓ İşlenen: ${(totalCount + skipCount + errorCount).toLocaleString()} | Eklenen: ${totalCount.toLocaleString()} | Duplicate: ${skipCount.toLocaleString()}`);
      }

      batch = [];

      // Rate limit için kısa bekle
      if (totalCount % 5000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Kalan batch
  if (batch.length > 0) {
    const { error } = await supabase
      .from('mahalleler')
      .insert(batch);

    if (!error) {
      totalCount += batch.length;
    } else if (error.message.includes('duplicate')) {
      skipCount += batch.length;
    } else {
      errorCount += batch.length;
    }
  }

  console.log(`\n✅ Import tamamlandı!`);
  console.log(`   Yeni eklenen: ${totalCount.toLocaleString()}`);
  console.log(`   Duplicate (skip): ${skipCount.toLocaleString()}`);
  console.log(`   Hata: ${errorCount.toLocaleString()}`);

  return totalCount;
}

async function main() {
  console.log('🚀 Mahalle import başlıyor...\n');

  const startTime = Date.now();

  try {
    await importMahalleler();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Süre: ${duration} saniye`);

  } catch (error) {
    console.error('❌ Import hatası:', error);
    process.exit(1);
  }
}

main();
