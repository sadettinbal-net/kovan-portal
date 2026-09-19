/**
 * İller tablosunu kontrol eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: iller } = await supabase
    .from('iller')
    .select('*')
    .order('sehir_adi');

  console.log('İller Tablosu:');
  console.log(`Toplam: ${iller?.length}`);
  console.log('\nİlk 10 il:');
  iller?.slice(0, 10).forEach(il => {
    console.log(`  ${il.id}. ${il.sehir_adi} (sehir_id: ${il.sehir_id})`);
  });

  // İzmir'i bul
  const izmir = iller?.find(il => il.sehir_adi.includes('ZM') || il.sehir_adi.includes('zm'));
  console.log('\nİzmir:');
  console.log(izmir);

  // İstanbul'u bul
  const istanbul = iller?.find(il => il.sehir_adi.includes('STAN') || il.sehir_adi.includes('stan'));
  console.log('\nİstanbul:');
  console.log(istanbul);

  // Ankara'yı bul
  const ankara = iller?.find(il => il.sehir_adi.includes('NKAR') || il.sehir_adi.includes('nkar'));
  console.log('\nAnkara:');
  console.log(ankara);
}

check();
