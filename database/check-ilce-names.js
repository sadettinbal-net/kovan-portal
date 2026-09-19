import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔍 İlçe adlarını karşılaştırıyorum...\n');

// Mahalleler tablosundan ilçeler
const { data: mahallelerIlce } = await supabase
  .from('mahalleler')
  .select('ilce_adi')
  .eq('il_adi', 'İSTANBUL')
  .limit(1000);

const mahalleIlceleri = [...new Set(mahallelerIlce?.map(m => m.ilce_adi))].sort();

console.log('📊 Mahalleler tablosundaki ilçeler (ilk 10):');
mahalleIlceleri.slice(0, 10).forEach(ilce => console.log(`  - ${ilce}`));

// Sanayi siteleri tablosundan ilçeler
const { data: sanayiIlce } = await supabase
  .from('sanayi_siteleri')
  .select('ilce_adi');

const sanayiIlceleri = [...new Set(sanayiIlce?.map(s => s.ilce_adi))].sort();

console.log('\n🏭 Sanayi sitelerindeki ilçeler:');
sanayiIlceleri.forEach(ilce => console.log(`  - ${ilce}`));

// Eşleşmeyen ilçeler
console.log('\n⚠️  Eşleşmeyen sanayi sitesi ilçeleri:');
sanayiIlceleri.forEach(ilce => {
  if (!mahalleIlceleri.includes(ilce)) {
    console.log(`  - ${ilce} (mahalleler tablosunda yok)`);
  }
});
