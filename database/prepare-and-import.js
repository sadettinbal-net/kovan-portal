/**
 * Tabloları hazırlar ve veri import eder
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 500; // Her seferde 500 kayıt (güvenli limit)

/**
 * SQL COPY formatından veri parse eder
 */
function parseCopyLine(line) {
  const values = line.split('\t');
  return values;
}

/**
 * Mahalle verilerini import eder
 */
async function importMahalleler() {
  console.log('📍 Mahalle verileri import ediliyor...');

  const fileStream = fs.createReadStream('database/08_import_mahalleler.sql');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let totalCount = 0;
  let skipCount = 0;

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
        console.error(`  ⚠️  Hata (${totalCount} civarında):`, error.message.substring(0, 100));
        skipCount += batch.length;
      } else {
        totalCount += batch.length;
        if (totalCount % 5000 === 0) {
          console.log(`  ✓ ${totalCount.toLocaleString()} mahalle eklendi`);
        }
      }

      batch = [];
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
      skipCount += batch.length;
    }
  }

  console.log(`✅ Toplam ${totalCount.toLocaleString()} mahalle eklendi (${skipCount} hata)\n`);
  return totalCount;
}

/**
 * Sokak verilerini import eder
 */
async function importSokaklar() {
  console.log('🛣️  Sokak verileri import ediliyor...');

  const fileStream = fs.createReadStream('database/09_import_sokaklar.sql');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let totalCount = 0;
  let skipCount = 0;

  let inData = false;

  for await (const line of rl) {
    if (line.startsWith('COPY public.sokaklar')) {
      inData = true;
      continue;
    }

    if (line === '\\.') {
      break;
    }

    if (!inData || !line.trim()) continue;

    const [sokak_id, sokak_adi, mahalle_id, mahalle_adi, ilce_id, ilce_adi, il_id, il_adi] = parseCopyLine(line);

    batch.push({
      sokak_id: parseInt(sokak_id),
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
        console.error(`  ⚠️  Hata (${totalCount} civarında):`, error.message.substring(0, 100));
        skipCount += batch.length;
      } else {
        totalCount += batch.length;
        if (totalCount % 10000 === 0) {
          console.log(`  ✓ ${totalCount.toLocaleString()} sokak eklendi`);
        }
      }

      batch = [];
    }
  }

  // Kalan batch
  if (batch.length > 0) {
    const { error } = await supabase
      .from('sokaklar')
      .insert(batch);

    if (!error) {
      totalCount += batch.length;
    } else {
      skipCount += batch.length;
    }
  }

  console.log(`✅ Toplam ${totalCount.toLocaleString()} sokak eklendi (${skipCount} hata)\n`);
  return totalCount;
}

/**
 * Ana import fonksiyonu
 */
async function main() {
  console.log('🚀 Veri import işlemi başlıyor...\n');
  console.log('✅ Şema güncellemesi yapıldı, import başlıyor...\n');

  const startTime = Date.now();

  try {
    // Önce mahalleler
    const mahalleCount = await importMahalleler();

    // Sonra sokaklar
    const sokakCount = await importSokaklar();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('='.repeat(60));
    console.log(`✅ Import tamamlandı!`);
    console.log(`   Mahalle: ${mahalleCount.toLocaleString()}`);
    console.log(`   Sokak: ${sokakCount.toLocaleString()}`);
    console.log(`   Süre: ${duration} saniye`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Import hatası:', error);
    process.exit(1);
  }
}

main();
