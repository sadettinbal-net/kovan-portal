/**
 * İzmir verilerini detaylı kontrol eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIzmir() {
  console.log('🔍 İZMİR VERİLERİ KONTROL EDİLİYOR...\n');

  // İzmir mahalleleri - case insensitive
  const { data: izmirMahalle1 } = await supabase
    .from('mahalleler')
    .select('*')
    .eq('il_adi', 'İZMİR')
    .limit(10);

  console.log('il_adi = "İZMİR" (büyük İ):');
  console.log(`  Kayıt sayısı: ${izmirMahalle1?.length || 0}`);
  if (izmirMahalle1 && izmirMahalle1.length > 0) {
    console.log(`  Örnek: ${izmirMahalle1[0].mahalle_adi} - ${izmirMahalle1[0].ilce_adi}`);
  }

  // İzmir mahalleleri - ILIKE
  const { data: izmirMahalle2 } = await supabase
    .from('mahalleler')
    .select('*')
    .ilike('il_adi', 'izmir')
    .limit(10);

  console.log('\nil_adi ILIKE "izmir":');
  console.log(`  Kayıt sayısı: ${izmirMahalle2?.length || 0}`);
  if (izmirMahalle2 && izmirMahalle2.length > 0) {
    console.log(`  Örnek: ${izmirMahalle2[0].mahalle_adi} - ${izmirMahalle2[0].ilce_adi}`);
    console.log(`  il_adi değeri: "${izmirMahalle2[0].il_adi}"`);
  }

  // Tüm mahallelerde "İZM" içeren kayıtlar
  const { data: izmSearch } = await supabase
    .from('mahalleler')
    .select('*')
    .ilike('il_adi', '%izm%')
    .limit(10);

  console.log('\nil_adi içinde "izm" geçen:');
  console.log(`  Kayıt sayısı: ${izmSearch?.length || 0}`);
  if (izmSearch && izmSearch.length > 0) {
    izmSearch.forEach(m => {
      console.log(`  - "${m.il_adi}" | ${m.mahalle_adi} - ${m.ilce_adi}`);
    });
  }

  // Il_id = 35 (İzmir'in plaka kodu)
  const { data: izmirById } = await supabase
    .from('mahalleler')
    .select('*')
    .eq('il_id', 35)
    .limit(10);

  console.log('\nil_id = 35:');
  console.log(`  Kayıt sayısı: ${izmirById?.length || 0}`);
  if (izmirById && izmirById.length > 0) {
    console.log(`  Örnek: ${izmirById[0].mahalle_adi} - ${izmirById[0].ilce_adi}`);
    console.log(`  il_adi değeri: "${izmirById[0].il_adi}"`);
  }

  // İzmir sokakları
  const { data: izmirSokak } = await supabase
    .from('sokaklar')
    .select('*')
    .eq('il_id', 35)
    .limit(10);

  console.log('\nİzmir Sokakları (il_id = 35):');
  console.log(`  Kayıt sayısı: ${izmirSokak?.length || 0}`);
  if (izmirSokak && izmirSokak.length > 0) {
    console.log(`  Örnek: ${izmirSokak[0].sokak_adi} - ${izmirSokak[0].mahalle_adi}, ${izmirSokak[0].ilce_adi}`);
  }

  // Dosyada İzmir verisi var mı kontrol
  console.log('\n📁 Kaynak dosyada İzmir kontrolü yapılıyor...');
}

checkIzmir();
