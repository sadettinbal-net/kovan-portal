// Salt okunur: sanayi_siteleri tablosunu okur, özet basar ve JSON olarak kaydeder.
import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const r = await fetch(`${url}/rest/v1/sanayi_siteleri?select=*&order=id&limit=10000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
const d = await r.json();
if (!Array.isArray(d)) { console.log('Hata:', r.status, JSON.stringify(d).slice(0, 300)); process.exit(1); }
fs.writeFileSync(process.argv[2], JSON.stringify(d, null, 1));
console.log('toplam', d.length);
console.log('sutunlar', Object.keys(d[0] || {}).join(', '));
const c = {};
for (const s of d) { const k = s.il_adi || '(il yok)'; c[k] = (c[k] || 0) + 1; }
console.log('il sayisi', Object.keys(c).length);
console.log(Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' | '));
