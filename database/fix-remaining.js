import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔧 Eksik eşleştirmeleri düzeltiyorum...\n');

// Önce alt kategorileri kontrol et
const { data: altKats } = await supabase
  .from('alt_kategoriler')
  .select('id, alt_kategori_adi, kategori_id')
  .in('alt_kategori_adi', ['Elektrik', 'Tornacı']);

console.log('Mevcut alt kategoriler:', altKats);

// Yoksa ekle
if (!altKats?.find(k => k.alt_kategori_adi === 'Elektrik')) {
  console.log('Elektrik kategorisi ekleniyor...');
  await supabase.from('alt_kategoriler').insert({ kategori_id: 6, alt_kategori_adi: 'Elektrik' });
}

if (!altKats?.find(k => k.alt_kategori_adi === 'Tornacı')) {
  console.log('Tornacı kategorisi ekleniyor...');
  await supabase.from('alt_kategoriler').insert({ kategori_id: 4, alt_kategori_adi: 'Tornacı' });
}

// Yeniden çek
const { data: yeniAltKats } = await supabase
  .from('alt_kategoriler')
  .select('id, alt_kategori_adi')
  .in('alt_kategori_adi', ['Elektrik', 'Tornacı']);

console.log('Güncel alt kategoriler:', yeniAltKats);

// Dükkanları güncelle
const elektrikId = yeniAltKats?.find(k => k.alt_kategori_adi === 'Elektrik')?.id;
const tornaciId = yeniAltKats?.find(k => k.alt_kategori_adi === 'Tornacı')?.id;

if (elektrikId) {
  const { error } = await supabase
    .from('dukkanlar')
    .update({ alt_kategori_id: elektrikId })
    .eq('kategori', 'Elektrik');

  if (!error) console.log(`✅ Elektrik dükkanları güncellendi (alt_kategori_id: ${elektrikId})`);
  else console.log('❌ Elektrik hatası:', error.message);
}

if (tornaciId) {
  const { error } = await supabase
    .from('dukkanlar')
    .update({ alt_kategori_id: tornaciId })
    .eq('kategori', 'Tornacı');

  if (!error) console.log(`✅ Tornacı dükkanları güncellendi (alt_kategori_id: ${tornaciId})`);
  else console.log('❌ Tornacı hatası:', error.message);
}

console.log('\n✅ Tamamlandı!');
