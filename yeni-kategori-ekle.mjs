import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ekle() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      alter table public.firmalar
      add column if not exists yeni_kategori boolean default false,
      add column if not exists yeni_kategori_tipi text;
    `
  });

  if (error) {
    console.error('Hata:', error);
  } else {
    console.log('✅ Yeni kategori alanları eklendi!');
  }
}

ekle();
