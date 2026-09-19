/**
 * Duplicate mahalle kontrolü
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Pendik mahalleleri
  const { data: pendikMahalleler } = await supabase
    .from('mahalleler')
    .select('*')
    .eq('ilce_adi', 'PENDİK')
    .order('mahalle_adi');

  console.log('PENDİK Mahalleler:');
  console.log(`Toplam kayıt: ${pendikMahalleler?.length}`);

  // Unique mahalle_id'leri göster
  const uniqueByMahalleId = new Map();
  pendikMahalleler?.forEach(m => {
    if (!uniqueByMahalleId.has(m.mahalle_id)) {
      uniqueByMahalleId.set(m.mahalle_id, m);
    }
  });

  console.log(`\nUnique mahalle_id sayısı: ${uniqueByMahalleId.size}`);
  console.log('\nUnique mahalleler (mahalle_id bazlı):');

  Array.from(uniqueByMahalleId.values())
    .slice(0, 15)
    .forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.mahalle_adi} (mahalle_id: ${m.mahalle_id}, id: ${m.id})`);
    });

  // Duplicate kontrol
  const mahalleCount = {};
  pendikMahalleler?.forEach(m => {
    mahalleCount[m.mahalle_adi] = (mahalleCount[m.mahalle_adi] || 0) + 1;
  });

  const duplicates = Object.entries(mahalleCount).filter(([_, count]) => count > 1);
  console.log(`\n${duplicates.length} mahalle ismi duplicate:`);
  duplicates.slice(0, 5).forEach(([adi, count]) => {
    console.log(`   ${adi}: ${count} kez`);
  });
}

check();
