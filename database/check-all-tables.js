import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugnyldayssftqvpoyywm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbnlsZGF5c3NmdHF2cG95eXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzUzMzIsImV4cCI6MjA5NDIxMTMzMn0.CHzMFwzrPdnZVSjScfr56YL6VaPsdLYO8EQO3FCeQGw';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Tüm Tabloları Kontrol Ediyorum...\n');

// Mahalleler
console.log('=== MAHALLELER TABLOSU ===');
const { data: m } = await supabase.from('mahalleler').select('*').limit(1);
if (m?.[0]) {
  console.log('Örnek kayıt:', m[0]);
  console.log('Kolonlar:', Object.keys(m[0]));
}

// Sokaklar
console.log('\n\n=== SOKAKLAR TABLOSU ===');
const { data: s } = await supabase.from('sokaklar').select('*').limit(1);
if (s?.[0]) {
  console.log('Örnek kayıt:', s[0]);
  console.log('Kolonlar:', Object.keys(s[0]));
}

// Dükkanlar
console.log('\n\n=== DUKKANLAR TABLOSU ===');
const { data: d } = await supabase.from('dukkanlar').select('*').limit(1);
if (d?.[0]) {
  console.log('Örnek kayıt:', d[0]);
  console.log('Kolonlar:', Object.keys(d[0]));
}

// İller
console.log('\n\n=== İLLER TABLOSU ===');
const { data: i } = await supabase.from('iller').select('*').limit(3);
if (i) {
  console.log('İller:', i.map(il => il.sehir_adi));
}
