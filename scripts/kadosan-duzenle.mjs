import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Kadosan Oto Sanayi Sitesi üst site ilişkisi kaldırılıyor...');

  const { data, error } = await supabase
    .from('sanayi_siteleri')
    .update({ ust_site_id: null })
    .eq('site_adi', 'Kadosan Oto Sanayi Sitesi')
    .eq('ilce_adi', 'ÜMRANİYE')
    .select();

  if (error) {
    console.error('Hata:', error);
    process.exit(1);
  }

  console.log('Başarılı! Güncellenen kayıt:', data);
}

main();
