/**
 * İller ve ilçeleri kontrol eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('İller tablosu:');
  const { data: iller, count: illerCount } = await supabase
    .from('iller')
    .select('*', { count: 'exact' });

  console.log(`Toplam: ${illerCount}`);
  console.log('İlk 3:', iller?.slice(0, 3));

  console.log('\nİlçeler tablosu:');
  const { data: ilceler, count: ilcelerCount } = await supabase
    .from('ilceler')
    .select('*', { count: 'exact' });

  console.log(`Toplam: ${ilcelerCount}`);
  console.log('İlk 3:', ilceler?.slice(0, 3));
}

check();
