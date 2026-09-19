import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data: dukkanlar } = await supabase
  .from('dukkanlar')
  .select('id, dukkan_adi, site_id')
  .limit(10);

console.log('İLK 10 DÜKKAN:');
dukkanlar?.forEach(d => {
  console.log(`${d.id}. ${d.dukkan_adi} - site_id: ${d.site_id || 'YOK'}`);
});

const boslar = dukkanlar?.filter(d => !d.site_id).length || 0;
console.log(`\nsite_id boş olan: ${boslar}/10`);
