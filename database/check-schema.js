/**
 * Supabase tablo şemasını kontrol eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Mahalleler tablosu:');
  const { data: mahalleler, error: err1 } = await supabase
    .from('mahalleler')
    .select('*')
    .limit(1);

  if (err1) {
    console.error('Hata:', err1.message);
  } else {
    console.log('Kolonlar:', mahalleler[0] ? Object.keys(mahalleler[0]) : 'Tablo boş');
  }

  console.log('\nSokaklar tablosu:');
  const { data: sokaklar, error: err2 } = await supabase
    .from('sokaklar')
    .select('*')
    .limit(1);

  if (err2) {
    console.error('Hata:', err2.message);
  } else {
    console.log('Kolonlar:', sokaklar[0] ? Object.keys(sokaklar[0]) : 'Tablo boş');
  }
}

checkSchema();
