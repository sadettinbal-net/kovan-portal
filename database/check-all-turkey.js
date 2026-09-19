/**
 * Tüm Türkiye mahalle ve sokak verilerini kontrol eder
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTurkey() {
  console.log('🇹🇷 TÜM TÜRKİYE VERİLERİ KONTROL EDİLİYOR...\n');
  console.log('='.repeat(60));

  // Tüm iller
  const { data: iller } = await supabase
    .from('iller')
    .select('*')
    .order('sehir_adi');

  console.log(`\n📍 Toplam İl: ${iller?.length}`);

  // Mahallelerde kaç farklı il var
  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('il_adi')
    .limit(100000);

  const uniqueIller = [...new Set(mahalleler?.map(m => m.il_adi) || [])];
  console.log(`📍 Mahalle verisi olan İl: ${uniqueIller.length}`);
  console.log(`   İller: ${uniqueIller.sort().slice(0, 10).join(', ')}${uniqueIller.length > 10 ? '...' : ''}`);

  // Her il için mahalle sayısı
  console.log('\n📊 İllere göre Mahalle Dağılımı (ilk 10 il):');
  const ilMahalleCount = {};
  mahalleler?.forEach(m => {
    ilMahalleCount[m.il_adi] = (ilMahalleCount[m.il_adi] || 0) + 1;
  });

  Object.entries(ilMahalleCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([il, count]) => {
      console.log(`   ${il}: ${count.toLocaleString()} mahalle`);
    });

  // Sokaklarda kaç farklı il var
  const { data: sokaklar } = await supabase
    .from('sokaklar')
    .select('il_adi')
    .limit(100000);

  const uniqueIllerSokak = [...new Set(sokaklar?.map(s => s.il_adi) || [])];
  console.log(`\n🛣️  Sokak verisi olan İl: ${uniqueIllerSokak.length}`);

  // Örnek: Ankara
  const { data: ankaraMahalleler } = await supabase
    .from('mahalleler')
    .select('ilce_adi')
    .eq('il_adi', 'ANKARA')
    .limit(10000);

  const ankaraIlceler = [...new Set(ankaraMahalleler?.map(m => m.ilce_adi) || [])];

  console.log('\n📍 ANKARA Örnek:');
  console.log(`   Toplam mahalle kaydı: ${ankaraMahalleler?.length.toLocaleString()}`);
  console.log(`   İlçe sayısı: ${ankaraIlceler.length}`);
  console.log(`   İlk 5 ilçe: ${ankaraIlceler.sort().slice(0, 5).join(', ')}`);

  // Örnek: İzmir
  const { data: izmirMahalleler } = await supabase
    .from('mahalleler')
    .select('ilce_adi')
    .eq('il_adi', 'İZMİR')
    .limit(10000);

  const izmirIlceler = [...new Set(izmirMahalleler?.map(m => m.ilce_adi) || [])];

  console.log('\n📍 İZMİR Örnek:');
  console.log(`   Toplam mahalle kaydı: ${izmirMahalleler?.length.toLocaleString()}`);
  console.log(`   İlçe sayısı: ${izmirIlceler.length}`);
  console.log(`   İlk 5 ilçe: ${izmirIlceler.sort().slice(0, 5).join(', ')}`);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test http://localhost:3000 adresinde yapılabilir!');
  console.log('   1. İl seçin (İstanbul, Ankara, İzmir, vb.)');
  console.log('   2. İlçe seçin');
  console.log('   3. Mahalle seçin');
  console.log('   4. Sokak seçin');
  console.log('\n✨ Tüm dropdown\'lar otomatik dolacak!\n');
}

checkAllTurkey();
