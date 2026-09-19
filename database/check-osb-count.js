import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('📊 Sanayi Siteleri İstatistikleri\n');

// Toplam OSB sayısı
const { data: allOsb, count: totalCount } = await supabase
  .from('sanayi_siteleri')
  .select('*', { count: 'exact' });

console.log(`✅ Toplam OSB Sayısı: ${totalCount}\n`);

// İllere göre dağılım
const ilceler = {};
allOsb?.forEach(osb => {
  if (!ilceler[osb.ilce_adi]) {
    ilceler[osb.ilce_adi] = [];
  }
  ilceler[osb.ilce_adi].push(osb.site_adi);
});

console.log('📍 İlçelere Göre Dağılım:\n');
Object.keys(ilceler).sort().forEach(ilce => {
  console.log(`${ilce}: ${ilceler[ilce].length} OSB`);
});

console.log('\n✅ Tamamlandı!');
