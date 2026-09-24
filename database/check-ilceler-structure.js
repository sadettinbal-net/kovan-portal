import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 İLÇELER TABLOSU YAPISI\n');

const { data, error } = await supabase
  .from('ilceler')
  .select('*')
  .limit(5);

if (error) {
  console.log('❌ Hata:', error);
} else {
  console.log(`✅ ${data.length} örnek kayıt bulundu\n`);

  if (data[0]) {
    console.log('Kolonlar:', Object.keys(data[0]));
    console.log('\nÖrnek kayıtlar:');
    data.forEach((row, idx) => {
      console.log(`\n${idx + 1}.`, row);
    });
  }
}

const { count } = await supabase
  .from('ilceler')
  .select('*', { count: 'exact', head: true });

console.log(`\n\n📊 Toplam ${count} ilçe kaydı var`);
