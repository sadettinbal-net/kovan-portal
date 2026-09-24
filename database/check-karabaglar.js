import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

const mahalleIds = [41160, 41293, 41171, 41186, 41201, 194865, 41252, 41266, 41278];

console.log('🔍 Karabağlar Mahalle ID\'leri Kontrol Ediliyor...\n');

for (const id of mahalleIds) {
  const { data } = await supabase
    .from('sokaklar')
    .select('mahalle_id, mahalle_adi, ilce_adi, il_adi')
    .eq('mahalle_id', id)
    .limit(1);

  if (data?.[0]) {
    console.log(`ID ${id}: ${data[0].mahalle_adi}`);
  }
}

console.log('\n📊 Unique mahalle_adi kontrol:');
const { data: allData } = await supabase
  .from('sokaklar')
  .select('mahalle_id, mahalle_adi')
  .in('mahalle_id', mahalleIds);

const uniqueByName = new Map();
allData?.forEach(m => {
  if (!uniqueByName.has(m.mahalle_adi)) {
    uniqueByName.set(m.mahalle_adi, []);
  }
  uniqueByName.get(m.mahalle_adi).push(m.mahalle_id);
});

console.log(`\nToplam unique mahalle_adi: ${uniqueByName.size}`);
uniqueByName.forEach((ids, name) => {
  if (ids.length > 1) {
    console.log(`⚠️  "${name}" → ${ids.length} farklı ID: ${ids.join(', ')}`);
  } else {
    console.log(`✓ "${name}" → ID: ${ids[0]}`);
  }
});
