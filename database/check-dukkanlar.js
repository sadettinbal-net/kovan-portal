import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data } = await supabase
  .from('dukkanlar')
  .select('id, dukkan_adi, alt_kategori_id, kategori')
  .order('id');

console.log('DÜKKANLAR:');
data?.forEach(d => {
  console.log(`${d.id}. ${d.dukkan_adi} - kategori: ${d.kategori} - alt_kategori_id: ${d.alt_kategori_id}`);
});

const bos = data?.filter(d => !d.alt_kategori_id).length || 0;
const dolu = data?.filter(d => d.alt_kategori_id).length || 0;

console.log(`\nBoş: ${bos}, Dolu: ${dolu}`);
