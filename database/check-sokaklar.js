/**
 * Sokak verilerini kontrol eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Toplam sokak sayısı
  const { count } = await supabase
    .from('sokaklar')
    .select('*', { count: 'exact', head: true });

  console.log(`Toplam sokak sayısı: ${count?.toLocaleString()}`);

  // Pendik bir mahalle
  const { data: mahalle } = await supabase
    .from('mahalleler')
    .select('*')
    .eq('mahalle_adi', 'AHMET YESEVİ MAHALLESİ')
    .eq('ilce_adi', 'PENDİK')
    .limit(1);

  console.log('\nAHMET YESEVİ MAHALLESİ (Pendik):');
  console.log(mahalle?.[0]);

  if (mahalle && mahalle.length > 0) {
    const m = mahalle[0];

    // mahalle_adi ile arama
    const { data: sokaklar1 } = await supabase
      .from('sokaklar')
      .select('sokak_adi')
      .eq('mahalle_adi', m.mahalle_adi)
      .eq('ilce_adi', 'PENDİK')
      .limit(5);

    console.log('\nmahalle_adi ile sokaklar:');
    console.log(sokaklar1);

    // mahalle_id ile arama
    const { data: sokaklar2 } = await supabase
      .from('sokaklar')
      .select('sokak_adi, mahalle_id')
      .eq('mahalle_id', m.mahalle_id)
      .limit(5);

    console.log('\nmahalle_id ile sokaklar:');
    console.log(sokaklar2);
  }

  // Rastgele sokaklar
  const { data: randomSokak } = await supabase
    .from('sokaklar')
    .select('*')
    .limit(3);

  console.log('\nRastgele sokaklar:');
  console.log(randomSokak);
}

check();
