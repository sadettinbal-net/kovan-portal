import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Nominatim API ile adresden koordinat al
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1&limit=1&countrycodes=tr`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding hatası:', error);
    return null;
  }
}

// Gecikme fonksiyonu (rate limiting için)
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeDukkanlar() {
  console.log('🔍 Dükkanlar için koordinat alınıyor...\n');

  // Koordinatı olmayan dükkanları çek
  const { data: dukkanlar, error } = await supabase
    .from('dukkanlar')
    .select('id, firma_adi, sokak_id')
    .is('latitude', null)
    .limit(50); // İlk 50 dükkan (test için)

  if (error) {
    console.error('Dükkan çekme hatası:', error);
    return;
  }

  if (!dukkanlar || dukkanlar.length === 0) {
    console.log('✅ Tüm dükkanların koordinatları zaten mevcut!\n');
    return;
  }

  console.log(`📍 ${dukkanlar.length} dükkan bulundu.\n`);

  for (let i = 0; i < dukkanlar.length; i++) {
    const dukkan = dukkanlar[i];

    // Sokak bilgisini çek
    const { data: sokakData } = await supabase
      .from('sokaklar')
      .select('sokak_adi, mahalle_id')
      .eq('id', dukkan.sokak_id)
      .single();

    if (!sokakData) {
      console.log(`⚠️  [${i + 1}/${dukkanlar.length}] Sokak bulunamadı: ${dukkan.firma_adi}`);
      continue;
    }

    // Mahalle bilgisini çek
    const { data: mahalleData } = await supabase
      .from('mahalleler')
      .select('mahalle_adi, ilce_id')
      .eq('id', sokakData.mahalle_id)
      .single();

    if (!mahalleData) {
      console.log(`⚠️  [${i + 1}/${dukkanlar.length}] Mahalle bulunamadı: ${dukkan.firma_adi}`);
      continue;
    }

    // İlçe bilgisini çek
    const { data: ilceData } = await supabase
      .from('ilceler')
      .select('ilce_adi, il_id')
      .eq('id', mahalleData.ilce_id)
      .single();

    if (!ilceData) {
      console.log(`⚠️  [${i + 1}/${dukkanlar.length}] İlçe bulunamadı: ${dukkan.firma_adi}`);
      continue;
    }

    // İl bilgisini çek
    const { data: ilData } = await supabase
      .from('iller')
      .select('sehir_adi')
      .eq('id', ilceData.il_id)
      .single();

    if (!ilData) {
      console.log(`⚠️  [${i + 1}/${dukkanlar.length}] İl bulunamadı: ${dukkan.firma_adi}`);
      continue;
    }

    // Tam adres oluştur
    const fullAddress = `${sokakData.sokak_adi}, ${mahalleData.mahalle_adi}, ${ilceData.ilce_adi}, ${ilData.sehir_adi}, Türkiye`;

    console.log(`🔎 [${i + 1}/${dukkanlar.length}] ${dukkan.firma_adi}`);
    console.log(`   Adres: ${fullAddress}`);

    // Koordinat al
    const coords = await geocodeAddress(fullAddress);

    if (coords) {
      // Veritabanını güncelle
      const { error: updateError } = await supabase
        .from('dukkanlar')
        .update({
          latitude: coords.lat,
          longitude: coords.lng,
          adres: fullAddress
        })
        .eq('id', dukkan.id);

      if (updateError) {
        console.log(`   ❌ Güncelleme hatası: ${updateError.message}`);
      } else {
        console.log(`   ✅ Koordinat: ${coords.lat}, ${coords.lng}`);
      }
    } else {
      console.log(`   ⚠️  Koordinat bulunamadı`);
    }

    // Rate limiting: Her istekten sonra 1 saniye bekle (Nominatim politikası)
    await delay(1000);
    console.log('');
  }

  console.log('✨ Dükkan koordinatları tamamlandı!\n');
}

async function geocodeSanayiSiteleri() {
  console.log('🏭 Sanayi siteleri için koordinat alınıyor...\n');

  // Koordinatı olmayan sanayi sitelerini çek
  const { data: siteler, error } = await supabase
    .from('sanayi_siteleri')
    .select('id, site_adi, il_adi, ilce_adi')
    .is('latitude', null)
    .limit(50); // İlk 50 site (test için)

  if (error) {
    console.error('Sanayi sitesi çekme hatası:', error);
    return;
  }

  if (!siteler || siteler.length === 0) {
    console.log('✅ Tüm sanayi sitelerinin koordinatları zaten mevcut!\n');
    return;
  }

  console.log(`📍 ${siteler.length} sanayi sitesi bulundu.\n`);

  for (let i = 0; i < siteler.length; i++) {
    const site = siteler[i];

    // Tam adres oluştur
    const fullAddress = `${site.site_adi}, ${site.ilce_adi || ''}, ${site.il_adi}, Türkiye`;

    console.log(`🔎 [${i + 1}/${siteler.length}] ${site.site_adi}`);
    console.log(`   Adres: ${fullAddress}`);

    // Koordinat al
    const coords = await geocodeAddress(fullAddress);

    if (coords) {
      // Veritabanını güncelle
      const { error: updateError } = await supabase
        .from('sanayi_siteleri')
        .update({
          latitude: coords.lat,
          longitude: coords.lng,
          adres: fullAddress
        })
        .eq('id', site.id);

      if (updateError) {
        console.log(`   ❌ Güncelleme hatası: ${updateError.message}`);
      } else {
        console.log(`   ✅ Koordinat: ${coords.lat}, ${coords.lng}`);
      }
    } else {
      console.log(`   ⚠️  Koordinat bulunamadı`);
    }

    // Rate limiting: Her istekten sonra 1 saniye bekle
    await delay(1000);
    console.log('');
  }

  console.log('✨ Sanayi sitesi koordinatları tamamlandı!\n');
}

async function main() {
  console.log('🗺️  Koordinat Toplama Scripti Başlatıldı\n');
  console.log('='.repeat(50) + '\n');

  // Önce sanayi siteleri
  await geocodeSanayiSiteleri();

  console.log('='.repeat(50) + '\n');

  // Sonra dükkanlar
  await geocodeDukkanlar();

  console.log('='.repeat(50));
  console.log('✅ Tüm işlemler tamamlandı!');
}

main().catch(console.error);
