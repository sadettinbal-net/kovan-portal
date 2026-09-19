import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Sanayi sitelerini kontrol et
const { data: siteler } = await supabase.from('sanayi_siteleri').select('id, site_adi');
console.log('SANAYİ SİTELERİ:', siteler?.length);
siteler?.slice(0, 3).forEach(s => console.log('  -', s.id, s.site_adi));

// İlk sitenin dükkanlarını çek (frontend gibi)
if (siteler && siteler.length > 0) {
  const { data: dukkanlar, error } = await supabase
    .from('dukkanlar')
    .select(`
      *,
      alt_kategoriler (
        id,
        alt_kategori_adi,
        kategori_id,
        kategoriler (
          id,
          kategori_adi,
          icon,
          renk
        )
      )
    `)
    .eq('site_id', siteler[0].id);

  if (error) {
    console.log('\n❌ HATA:', error.message);
  } else {
    console.log(`\n${siteler[0].site_adi} SİTESİNDEKİ DÜKKANLAR:`, dukkanlar?.length);
    dukkanlar?.forEach(d => {
      console.log(`  - ${d.dukkan_adi} => `, d.alt_kategoriler?.kategoriler?.kategori_adi || 'KATEGORİ YOK');
    });
  }
}
