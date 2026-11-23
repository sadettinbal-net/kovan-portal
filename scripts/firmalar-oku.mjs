// Salt okunur: firmalar tablosunu sayar.
import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const h = { apikey: key, Authorization: `Bearer ${key}` };
const first = await (await fetch(`${url}/rest/v1/firmalar?select=*&limit=1`, { headers: h })).json();
console.log('sutunlar', Object.keys(first[0] || {}).join(', '));
let all = [];
for (let o = 0; ; o += 1000) {
  const r = await fetch(`${url}/rest/v1/firmalar?select=*&order=id&offset=${o}&limit=1000`, { headers: h });
  const d = await r.json(); if (!Array.isArray(d)) { console.log('hata', JSON.stringify(d).slice(0, 200)); break; }
  all = all.concat(d); if (d.length < 1000) break;
}
fs.writeFileSync(process.argv[2], JSON.stringify(all));
console.log('toplam firma', all.length);
