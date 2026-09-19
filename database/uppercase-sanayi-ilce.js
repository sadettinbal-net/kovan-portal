import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔧 Sanayi sitesi ilçe adlarını büyük harfe çeviriyorum...\n');

// Tüm sanayi sitelerini al
const { data: siteler } = await supabase
  .from('sanayi_siteleri')
  .select('id, ilce_adi');

for (const site of siteler || []) {
  if (site.ilce_adi) {
    const upperIlce = site.ilce_adi.toLocaleUpperCase('tr-TR');

    const { error } = await supabase
      .from('sanayi_siteleri')
      .update({ ilce_adi: upperIlce })
      .eq('id', site.id);

    if (error) {
      console.log(`❌ ${site.ilce_adi} → ${upperIlce} HATA:`, error.message);
    } else {
      console.log(`✅ ${site.ilce_adi} → ${upperIlce}`);
    }
  }
}

console.log('\n✅ Tamamlandı!');
