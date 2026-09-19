/**
 * Veritabanı migration çalıştırır
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('📝 Migration çalıştırılıyor...\n');

  const sql = fs.readFileSync('database/10_alter_tables_add_columns.sql', 'utf-8');

  // SQL'i satırlara böl ve çalıştır
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  for (const statement of statements) {
    console.log('Çalıştırılıyor:', statement.substring(0, 60) + '...');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      console.error('❌ Hata:', error.message);
      // Devam et
    } else {
      console.log('✅ Başarılı');
    }
  }

  console.log('\n✅ Migration tamamlandı!');
}

runMigration();
