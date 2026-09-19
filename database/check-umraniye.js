/**
 * Ümraniye verilerini kontrol eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // İstanbul mahallelerinden örnekler
  const { data: istanbulMahalle } = await supabase
    .from('mahalleler')
    .select('*')
    .ilike('il_adi', 'İstanbul')
    .limit(5);

  console.log('İstanbul Mahalleleri (örnek):');
  console.log(istanbulMahalle);

  // Ümraniye içeren kayıtlar
  const { data: umraniye } = await supabase
    .from('mahalleler')
    .select('*')
    .ilike('ilce_adi', '%ümraniye%')
    .limit(5);

  console.log('\nÜmraniye içeren mahalleler:');
  console.log(umraniye);

  // İstanbul ilçeleri unique
  const { data: istanbulIlceler } = await supabase
    .from('mahalleler')
    .select('ilce_adi')
    .ilike('il_adi', 'İstanbul')
    .limit(100);

  const uniqueIlceler = [...new Set(istanbulIlceler?.map(m => m.ilce_adi) || [])];
  console.log('\nİstanbul İlçeleri (unique):');
  console.log(uniqueIlceler.sort());
}

check();
