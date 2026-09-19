import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔧 Sanayi sitelerinin ilçe adlarını düzeltiyorum...\n');

// İlçe adı eşleştirme tablosu (site adından çıkarıyoruz)
const ilceMapping = {
  2848: 'Başakşehir',     // İkitelli → Başakşehir
  2876: 'Tuzla',
  2877: 'Ümraniye',        // Dudullu → Ümraniye
  2852: 'Beylikdüzü',
  2865: 'Kartal',
  2868: 'Pendik',
  2872: 'Sultanbeyli',
  2869: 'Sancaktepe',
  2854: 'Büyükçekmece',
  2871: 'Silivri',
  2855: 'Çatalca',
  2873: 'Sultangazi',
  2858: 'Esenyurt',
  2844: 'Avcılar',
  2845: 'Bağcılar',
  2861: 'Gaziosmanpaşa',
  2867: 'Maltepe',
  2863: 'Kadıköy',
  2875: 'Şişli',
  2870: 'Sarıyer'
};

// Tüm sanayi sitelerini güncelle
for (const [ilce_id, ilce_adi] of Object.entries(ilceMapping)) {
  const { data, error } = await supabase
    .from('sanayi_siteleri')
    .update({ ilce_adi: ilce_adi })
    .eq('ilce_id', parseInt(ilce_id));

  if (error) {
    console.log(`❌ ${ilce_adi} güncellenirken hata:`, error.message);
  } else {
    console.log(`✅ ${ilce_adi} → ${data?.length || '?'} site güncellendi`);
  }
}

// Kontrol et
const { data: siteler } = await supabase
  .from('sanayi_siteleri')
  .select('ilce_adi, site_adi')
  .limit(5);

console.log('\n📊 İlk 5 site:');
siteler?.forEach(s => console.log(`  - ${s.ilce_adi} → ${s.site_adi}`));

console.log('\n✅ Tamamlandı!');
