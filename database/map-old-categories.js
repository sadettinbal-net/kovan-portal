/**
 * Eski kategori stringlerini yeni alt_kategori_id'lere eşleştirir
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Eski kategori string'lerini yeni alt_kategori_id'lere eşleme
const kategoriHaritasi = {
  'Elektrik Bobinaj': 'Elektrik Bobinaj',
  'Torna': 'Torna',
  'Oto Elektrik': 'Oto Elektrik',
  'Tornacılık': 'Torna',
  'Kaynak': 'Kaynak',
  'Oto Tamir': 'Oto Tamir',
  'Motor Tamiri': 'Motor Tamiri',
  'Mekanik': 'Mekanik',
  'Oto Boyacı': 'Oto Boyacı',
  'Lastikçi': 'Lastikçi',
  'Oto Yıkama': 'Oto Yıkama',
  'Metal İşleme': 'Metal İşleme',
  'CNC İşleme': 'CNC İşleme',
  'Lazer Kesim': 'Lazer Kesim'
};

async function mapCategories() {
  console.log('🔄 Eski kategorileri yeni sisteme eşleştiriyorum...\n');

  // Alt kategorileri çek
  const { data: altKategoriler } = await supabase
    .from('alt_kategoriler')
    .select('id, alt_kategori_adi');

  // Dükkanları çek
  const { data: dukkanlar } = await supabase
    .from('dukkanlar')
    .select('id, dukkan_adi, kategori');

  console.log(`📊 Toplam ${dukkanlar?.length || 0} dükkan bulundu\n`);

  let eslesmeSayisi = 0;
  let eslesmeyenler = new Set();

  for (const dukkan of dukkanlar || []) {
    if (!dukkan.kategori) {
      console.log(`⚠️  ${dukkan.dukkan_adi}: Kategori yok`);
      continue;
    }

    // Eşleştirme yap
    const yeniKategori = kategoriHaritasi[dukkan.kategori] || dukkan.kategori;
    const altKat = altKategoriler?.find(ak => ak.alt_kategori_adi === yeniKategori);

    if (altKat) {
      // Güncelle
      const { error } = await supabase
        .from('dukkanlar')
        .update({ alt_kategori_id: altKat.id })
        .eq('id', dukkan.id);

      if (!error) {
        console.log(`✅ ${dukkan.dukkan_adi}: ${dukkan.kategori} → ${altKat.alt_kategori_adi} (ID: ${altKat.id})`);
        eslesmeSayisi++;
      } else {
        console.log(`❌ ${dukkan.dukkan_adi}: Hata - ${error.message}`);
      }
    } else {
      eslesmeyenler.add(dukkan.kategori);
      console.log(`⚠️  ${dukkan.dukkan_adi}: "${dukkan.kategori}" eşleşme bulunamadı`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 ÖZET:');
  console.log(`   Toplam Dükkan: ${dukkanlar?.length || 0}`);
  console.log(`   Eşleştirilen: ${eslesmeSayisi}`);
  console.log(`   Eşleşmeyen: ${eslesmeyenler.size}`);

  if (eslesmeyenler.size > 0) {
    console.log('\n⚠️  Eşleşmeyen kategoriler:');
    eslesmeyenler.forEach(kat => console.log(`   - ${kat}`));
    console.log('\nBu kategorileri manuel olarak kategoriler/alt_kategoriler tablosuna ekleyebilirsiniz.');
  }

  console.log('\n✅ Eşleştirme tamamlandı!\n');
}

mapCategories().catch(err => {
  console.error('❌ Hata:', err.message);
  process.exit(1);
});
