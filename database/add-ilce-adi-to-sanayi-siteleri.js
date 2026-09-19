import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔧 Sanayi sitelerine ilçe adı ekleniyor...\n');

// Önce tüm sanayi sitelerini çekelim
const { data: siteler, error: sitelerError } = await supabase
  .from('sanayi_siteleri')
  .select('id, ilce_id, site_adi');

if (sitelerError) {
  console.log('❌ Hata:', sitelerError.message);
  process.exit(1);
}

console.log(`📊 Toplam ${siteler.length} sanayi sitesi bulundu\n`);

// Her site için ilce_id'den ilce_adi'yi bul ve güncelle
for (const site of siteler) {
  // ilce_id'den ilce_adi'yi bul
  const { data: ilce, error: ilceError } = await supabase
    .from('mahalleler')
    .select('ilce_adi')
    .eq('ilce_id', site.ilce_id)
    .limit(1)
    .single();

  if (ilce && ilce.ilce_adi) {
    console.log(`✅ ${site.site_adi} → ${ilce.ilce_adi}`);

    // İlce adını ekle (eğer ilce_adi sütunu yoksa hata verecek, o zaman SQL ile eklemeliyiz)
    const { error: updateError } = await supabase
      .from('sanayi_siteleri')
      .update({ ilce_adi: ilce.ilce_adi })
      .eq('id', site.id);

    if (updateError) {
      console.log(`❌ ${site.site_adi} güncellenirken hata:`, updateError.message);
    }
  } else {
    console.log(`⚠️  ${site.site_adi} - İlçe bulunamadı (ilce_id: ${site.ilce_id})`);
  }
}

console.log('\n✅ Tamamlandı!');
