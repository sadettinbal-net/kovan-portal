/**
 * Mahalle ve Sokak verilerini Supabase'e import eder
 *
 * Kullanım:
 * node database/import-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 1000; // Her seferde 1000 kayıt

/**
 * SQL COPY formatından veri parse eder
 */
function parseCopyLine(line, columns) {
  const values = line.split('\t');
  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = values[idx] || null;
  });
  return obj;
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
  let lineCount = 0;
  const columns = ['mahalle_id', 'mahalle_adi', 'ilce_id', 'ilce_adi', 'il_id', 'il_adi'];

  let inData = false;

  for await (const line of rl) {
    lineCount++;

    if (line.startsWith('COPY public.mahalleler')) {
      inData = true;
      continue;
    }

    if (line === '\\.') {
      inData = false;
      break;
    }

    if (!inData || !line.trim()) continue;

    const record = parseCopyLine(line, columns);
    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase
        .from('mahalleler')
        .insert(batch);

      if (error) {
        console.error(`Hata (satır ${totalCount}):`, error.message);
        // Devam et
      }

      totalCount += batch.length;
      console.log(`  ✓ ${totalCount} mahalle eklendi`);
      batch = [];
    }
  }

  // Kalan batch'i ekle
  if (batch.length > 0) {
    const { error } = await supabase
      .from('mahalleler')
      .insert(batch);

    if (error) {
      console.error('Son batch hatası:', error.message);
    }
    totalCount += batch.length;
  }

  console.log(`✅ Toplam ${totalCount} mahalle eklendi\n`);
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
  const columns = ['sokak_id', 'sokak_adi', 'mahalle_id', 'mahalle_adi', 'ilce_id', 'ilce_adi', 'il_id', 'il_adi'];

  let inData = false;

  for await (const line of rl) {
    if (line.startsWith('COPY public.sokaklar')) {
      inData = true;
      continue;
    }

    if (line === '\\.') {
      inData = false;
      break;
    }

    if (!inData || !line.trim()) continue;

    const record = parseCopyLine(line, columns);
    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase
        .from('sokaklar')
        .insert(batch);

      if (error) {
        console.error(`Hata (satır ${totalCount}):`, error.message);
        // Devam et
      }

      totalCount += batch.length;
      console.log(`  ✓ ${totalCount} sokak eklendi`);
      batch = [];
    }
  }

  // Kalan batch'i ekle
  if (batch.length > 0) {
    const { error } = await supabase
      .from('sokaklar')
      .insert(batch);

    if (error) {
      console.error('Son batch hatası:', error.message);
    }
    totalCount += batch.length;
  }

  console.log(`✅ Toplam ${totalCount} sokak eklendi\n`);
  return totalCount;
}

/**
 * Ana import fonksiyonu
 */
async function main() {
  console.log('🚀 Veri import işlemi başlıyor...\n');

  const startTime = Date.now();

  try {
    // Önce mahalleler
    const mahalleCount = await importMahalleler();

    // Sonra sokaklar
    const sokakCount = await importSokaklar();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('=' .repeat(50));
    console.log(`✅ Import tamamlandı!`);
    console.log(`   Mahalle: ${mahalleCount.toLocaleString()}`);
    console.log(`   Sokak: ${sokakCount.toLocaleString()}`);
    console.log(`   Süre: ${duration} saniye`);
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Import hatası:', error);
    process.exit(1);
  }
}

main();
