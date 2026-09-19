/**
 * İlçe ID mapping kontrol eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // İlçeler tablosundan bir örnek
  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('*')
    .eq('sehir_id', 34) // İstanbul
    .limit(3);

  console.log('İstanbul İlçeleri (ilceler tablosundan):');
  console.log(ilceler);

  if (ilceler && ilceler.length > 0) {
    const ilceId = ilceler[0].id;
    console.log(`\nİlçe ID ${ilceId} için mahalleler:`);

    const { data: mahalleler } = await supabase
      .from('mahalleler')
      .select('*')
      .eq('ilce_id', ilceId)
      .limit(3);

    console.log(mahalleler);
    console.log(`Toplam: ${mahalleler?.length || 0}`);
  }
}

check();
