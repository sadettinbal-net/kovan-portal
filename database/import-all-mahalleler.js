/**
 * TÜM mahalle verilerini import eder (mevcut olanları skip eder)
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

async function importAll() {
  console.log('🚀 TÜM mahalle verileri import ediliyor...\n');

  // Önce mevcut mahalle_id'leri al
  console.log('📊 Mevcut mahalle_id\'ler kontrol ediliyor...');
  const { data: existingData } = await supabase
    .from('mahalleler')
    .select('mahalle_id')
    .not('mahalle_id', 'is', null);

  const existingIds = new Set(existingData?.map(m => m.mahalle_id) || []);
  console.log(`   Mevcut: ${existingIds.size.toLocaleString()} mahalle\n`);

  const fileStream = fs.createReadStream('database/08_import_mahalleler.sql');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let totalCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let lineCount = 0;

  let inData = false;

  for await (const line of rl) {
    if (line.startsWith('COPY public.mahalleler')) {
      inData = true;
      console.log('📖 Dosya okunuyor...\n');
      continue;
    }

    if (line === '\\.') {
      console.log('\n✅ Dosya sonu');
      break;
    }

    if (!inData || !line.trim()) continue;

    lineCount++;

    const [mahalle_id, mahalle_adi, ilce_id, ilce_adi, il_id, il_adi] = parseCopyLine(line);
    const mahalleIdInt = parseInt(mahalle_id);

    // Eğer bu ID zaten varsa skip et
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
        console.error(`  ⚠️  Hata:`, error.message.substring(0, 100));
        errorCount += batch.length;
      } else {
        totalCount += batch.length;
      }

      if ((totalCount + skipCount) % 50000 === 0) {
        console.log(`  ✓ İşlenen: ${(totalCount + skipCount).toLocaleString()} | Yeni: ${totalCount.toLocaleString()} | Skip: ${skipCount.toLocaleString()}`);
      }

      batch = [];

      // Her 10K kayıtta kısa ara (rate limit)
      if (totalCount % 10000 === 0 && totalCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
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
    } else {
      console.error('Son batch hatası:', error.message);
      errorCount += batch.length;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Import tamamlandı!`);
  console.log(`   Dosyada toplam: ${lineCount.toLocaleString()} mahalle`);
  console.log(`   Yeni eklenen: ${totalCount.toLocaleString()}`);
  console.log(`   Zaten vardı (skip): ${skipCount.toLocaleString()}`);
  console.log(`   Hata: ${errorCount.toLocaleString()}`);
  console.log(`   Veritabanında toplam: ${(existingIds.size + totalCount).toLocaleString()}`);
  console.log(`${'='.repeat(60)}`);

  return totalCount;
}

async function main() {
  const startTime = Date.now();

  try {
    await importAll();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Süre: ${duration} saniye (${(duration / 60).toFixed(1)} dakika)`);

  } catch (error) {
    console.error('❌ Import hatası:', error);
    process.exit(1);
  }
}

main();
