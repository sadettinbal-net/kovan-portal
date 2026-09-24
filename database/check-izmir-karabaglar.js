import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 İzmir Karabağlar Kontrol...\n');

// Karabağlar ilçesi olan tüm kayıtları çek
const { data: karabaglar } = await supabase
  .from('sokaklar')
  .select('il_adi, ilce_adi, mahalle_id, mahalle_adi')
  .eq('ilce_adi', 'KARABAĞLAR');

console.log(`Toplam ${karabaglar?.length} sokak kaydı bulundu\n`);

// İl adlarına göre grupla
const illerMap = new Map();
karabaglar?.forEach(k => {
  const ilAdi = k.il_adi;
  if (!illerMap.has(ilAdi)) {
    illerMap.set(ilAdi, new Set());
  }
  illerMap.get(ilAdi).add(k.mahalle_id);
});

console.log('KARABAĞLAR ilçesi hangi illerde var:\n');
illerMap.forEach((mahalleIds, ilAdi) => {
  console.log(`  ${ilAdi}: ${mahalleIds.size} unique mahalle`);
});

// İzmir için detaylı kontrol
console.log('\n\n📍 İzmir için tüm il_adi varyasyonları:');
const { data: izmirSokaklar } = await supabase
  .from('sokaklar')
  .select('il_adi')
  .ilike('il_adi', '%izmir%');

const izmirVariants = [...new Set(izmirSokaklar?.map(s => s.il_adi))];
console.log(izmirVariants);

// Her varyasyon için Karabağlar mahalle sayısı
for (const variant of izmirVariants) {
  const { data } = await supabase
    .from('sokaklar')
    .select('mahalle_id, mahalle_adi')
    .eq('il_adi', variant)
    .eq('ilce_adi', 'KARABAĞLAR');

  const uniqueMahalleler = new Set(data?.map(d => d.mahalle_id));
  console.log(`\n"${variant}" + KARABAĞLAR: ${uniqueMahalleler.size} unique mahalle`);
  if (uniqueMahalleler.size > 0) {
    console.log('  Mahalle ID\'leri:', Array.from(uniqueMahalleler));
  }
}
