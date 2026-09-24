/**
 * CSV parts dosyalarını Supabase'e yükler (part_ac.csv'den başlayarak)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import dotenv from 'dotenv';

// .env.local dosyasını yükle
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 500; // Batch boyutu
const DELAY_MS = 200; // Her batch sonrası bekleme süresi (ms)

// Yüklenecek dosyalar (part_ac'den başlayarak)
const FILES_TO_UPLOAD = [
  'part_ac.csv', 'part_ad.csv', 'part_ae.csv', 'part_af.csv', 'part_ag.csv',
  'part_ah.csv', 'part_ai.csv', 'part_aj.csv', 'part_ak.csv', 'part_al.csv',
  'part_am.csv', 'part_an.csv', 'part_ao.csv', 'part_ap.csv', 'part_aq.csv',
  'part_ar.csv', 'part_as.csv', 'part_at.csv', 'part_au.csv', 'part_av.csv',
  'part_aw.csv', 'part_ax.csv'
];

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

async function uploadCSVFile(filename) {
  const filePath = path.join('database', 'mahalleler_parts', filename);

  console.log(`\n📂 ${filename} yükleniyor...`);

  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  Dosya bulunamadı: ${filePath}`);
    return { success: 0, duplicate: 0, error: 0 };
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;

    // İlk satırı (header) atla
    if (lineNumber === 1) continue;

    if (!line.trim()) continue;

    const [mahalle_id, mahalle_adi, ilce_id, ilce_adi, il_id, il_adi] = parseCSVLine(line);

    if (!mahalle_id || !mahalle_adi || !ilce_id || !il_id) {
      console.log(`   ⚠️  Satır ${lineNumber} hatalı, atlanıyor: ${line.substring(0, 80)}`);
      continue;
    }

    batch.push({
      mahalle_id: parseInt(mahalle_id),
      mahalle_adi: mahalle_adi,
      ilce_id: parseInt(ilce_id),
      ilce_adi: ilce_adi || '',
      il_id: parseInt(il_id),
      il_adi: il_adi || ''
    });

    if (batch.length >= BATCH_SIZE) {
      const { data, error } = await supabase
        .from('mahalleler')
        .insert(batch)
        .select();

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          duplicateCount += batch.length;
        } else {
          console.error(`   ⚠️  Hata (satır ~${lineNumber}):`, error.message.substring(0, 100));
          errorCount += batch.length;
        }
      } else {
        successCount += batch.length;
      }

      // İlerleme göster
      if ((successCount + duplicateCount + errorCount) % 2000 === 0) {
        console.log(`   → İşlenen: ${(successCount + duplicateCount + errorCount).toLocaleString()} | Başarılı: ${successCount.toLocaleString()}`);
      }

      batch = [];

      // Rate limit için bekle
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  // Kalan batch'i yükle
  if (batch.length > 0) {
    const { data, error } = await supabase
      .from('mahalleler')
      .insert(batch)
      .select();

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        duplicateCount += batch.length;
      } else {
        console.error(`   ⚠️  Son batch hatası:`, error.message.substring(0, 100));
        errorCount += batch.length;
      }
    } else {
      successCount += batch.length;
    }
  }

  console.log(`   ✅ ${filename} tamamlandı - Başarılı: ${successCount}, Duplicate: ${duplicateCount}, Hata: ${errorCount}`);

  return { success: successCount, duplicate: duplicateCount, error: errorCount };
}

async function main() {
  console.log('🚀 CSV Parts Import Başlıyor...\n');
  console.log(`📋 Toplam ${FILES_TO_UPLOAD.length} dosya yüklenecek\n`);

  const startTime = Date.now();
  let totalSuccess = 0;
  let totalDuplicate = 0;
  let totalError = 0;

  for (let i = 0; i < FILES_TO_UPLOAD.length; i++) {
    const filename = FILES_TO_UPLOAD[i];
    console.log(`\n[${i + 1}/${FILES_TO_UPLOAD.length}] ${filename}`);

    const result = await uploadCSVFile(filename);
    totalSuccess += result.success;
    totalDuplicate += result.duplicate;
    totalError += result.error;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('✅ TÜM DOSYALAR YÜKLENDİ!\n');
  console.log(`📊 ÖZET:`);
  console.log(`   Toplam Başarılı: ${totalSuccess.toLocaleString()}`);
  console.log(`   Duplicate (atlandı): ${totalDuplicate.toLocaleString()}`);
  console.log(`   Hata: ${totalError.toLocaleString()}`);
  console.log(`   Toplam İşlem: ${(totalSuccess + totalDuplicate + totalError).toLocaleString()}`);
  console.log(`\n⏱️  Toplam Süre: ${duration} saniye`);
  console.log('='.repeat(60));
}

main().catch(console.error);
