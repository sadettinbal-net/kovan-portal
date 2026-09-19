import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// İlk siteyi bul
const { data: siteler } = await supabase
  .from('sanayi_siteleri')
  .select('id, site_adi')
  .limit(1);

if (!siteler || siteler.length === 0) {
  console.log('Site bulunamadı');
  process.exit(1);
}

const site = siteler[0];
console.log(`🏭 ${site.site_adi}\n`);

// Dükkanları çek
const { data: dukkanlar } = await supabase
  .from('dukkanlar')
  .select('id, dukkan_adi, usta_adi, telefon, alt_kategori_id')
  .eq('site_id', site.id);

console.log(`📊 Toplam ${dukkanlar?.length || 0} dükkan\n`);

// Her dükkan için kategori bilgisini ayrı çek
for (const dukkan of dukkanlar || []) {
  if (dukkan.alt_kategori_id) {
    const { data: altKat } = await supabase
      .from('alt_kategoriler')
      .select('alt_kategori_adi, kategoriler(kategori_adi, icon, renk)')
      .eq('id', dukkan.alt_kategori_id)
      .single();

    console.log(`✅ ${dukkan.dukkan_adi}`);
    console.log(`   Alt Kategori: ${altKat?.alt_kategori_adi}`);
    console.log(`   Ana Kategori: ${altKat?.kategoriler?.icon} ${altKat?.kategoriler?.kategori_adi}\n`);
  } else {
    console.log(`⚠️  ${dukkan.dukkan_adi} - KATEGORİ YOK\n`);
  }
}
