/**
 * Kategori tabloları migration scripti
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Kategori tabloları oluşturuluyor...\n');

  const sql = fs.readFileSync('database/11_create_kategori_tables.sql', 'utf8');

  // SQL komutlarını satır satır çalıştır
  const commands = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'));

  for (const command of commands) {
    if (command.trim()) {
      console.log(`Çalıştırılıyor: ${command.substring(0, 50)}...`);

      const { error } = await supabase.rpc('exec_sql', { sql_query: command });

      if (error) {
        console.error(`❌ Hata:`, error.message);
        // Tablo zaten varsa devam et
        if (!error.message.includes('already exists')) {
          throw error;
        } else {
          console.log('   (Tablo zaten mevcut, devam ediliyor...)');
        }
      } else {
        console.log('   ✓ Başarılı');
      }
    }
  }

  console.log('\n✅ Kategori tabloları oluşturuldu!\n');

  // Tabloları kontrol et
  const { data: kategoriler, error: katError } = await supabase
    .from('kategoriler')
    .select('*')
    .limit(1);

  const { data: altKategoriler, error: altError } = await supabase
    .from('alt_kategoriler')
    .select('*')
    .limit(1);

  if (!katError && !altError) {
    console.log('✅ Tablolar başarıyla oluşturuldu ve erişilebilir!\n');
  } else {
    console.log('⚠️  Dikkat: Tablolar oluşturuldu ama direkt SQL ile erişmek gerekebilir.');
    console.log('   Supabase Dashboard\'dan kontrol edin.\n');
  }
}

runMigration().catch(err => {
  console.error('❌ Migration hatası:', err);
  process.exit(1);
});
