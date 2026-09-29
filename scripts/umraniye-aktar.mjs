// Ümraniye Sanayi Sitesi firmalarını Kovan'a aktarır (Ümraniye'de hiçbir şey değişmez, sadece okunur).
// Çalıştırma (proje klasöründe):
//   UMRANIYE_URL=https://....supabase.co UMRANIYE_ANON_KEY=sb_publishable_... node scripts/umraniye-aktar.mjs --deneme
//   (--deneme olmadan gerçekten yazar; tekrar çalıştırmak güvenlidir, aynı numaralı firmalar güncellenir)
// Kovan anahtarları .env.local'dan okunur.
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });
const DENEME = process.argv.includes('--deneme');
const BUCKET = 'firma-fotograflari';

const kovanUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const umrUrl = process.env.UMRANIYE_URL;
if (!kovanUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY || !umrUrl || !process.env.UMRANIYE_ANON_KEY) {
  console.error('Eksik ayar: .env.local (Kovan) ve UMRANIYE_URL / UMRANIYE_ANON_KEY gerekli.');
  process.exit(1);
}
const secenek = { auth: { persistSession: false, autoRefreshToken: false } };
const kovan = createClient(kovanUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, secenek);
const umr = createClient(umrUrl, process.env.UMRANIYE_ANON_KEY, secenek);

function ilceYazimi(buyuk) {
  if (!buyuk) return null;
  return buyuk.toLocaleLowerCase('tr-TR').replace(/(^|\s)(\S)/g, (_, b, h) => b + h.toLocaleUpperCase('tr-TR'));
}

// 1. Ümraniye firmalarını oku
const firmalar = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await umr.from('firmalar').select('*').order('id').range(from, from + 999);
  if (error) throw new Error('Ümraniye okunamadı: ' + error.message);
  firmalar.push(...data);
  if (data.length < 1000) break;
}
console.log(`Ümraniye'den okunan firma: ${firmalar.length}`);

// 2. Kovan sanayi siteleri (ad → id, ilçe)
const { data: siteler, error: siteHata } = await kovan.from('sanayi_siteleri').select('id, site_adi, ilce_adi').eq('il_adi', 'İSTANBUL');
if (siteHata) throw new Error(siteHata.message);
const siteHaritasi = new Map(siteler.map((s) => [s.site_adi, s]));

// 3. Ümraniye deposundaki resmi Kovan deposuna kopyala, yeni adresi döndür
const umrDepo = `${umrUrl}/storage/v1/object/public/${BUCKET}/`;
let kopyalananResim = 0;
async function resimTasi(url) {
  if (!url || !url.startsWith(umrDepo)) return url;
  const yol = decodeURIComponent(url.slice(umrDepo.length).split('?')[0]);
  if (DENEME) return kovan.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Resim indirilemedi (${res.status}): ${url}`);
    return url;
  }
  const { error } = await kovan.storage
    .from(BUCKET)
    .upload(yol, Buffer.from(await res.arrayBuffer()), { contentType: res.headers.get('content-type') || undefined, upsert: true });
  if (error) {
    console.warn(`  Resim yüklenemedi: ${yol} — ${error.message}`);
    return url;
  }
  kopyalananResim++;
  return kovan.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl;
}

// 4. Kovan kayıtlarını hazırla
const eslesmeyenSiteler = new Map();
const kayitlar = [];
for (const f of firmalar) {
  const site = siteHaritasi.get(f.sanayi_sitesi);
  if (f.sanayi_sitesi && !site) eslesmeyenSiteler.set(f.sanayi_sitesi, (eslesmeyenSiteler.get(f.sanayi_sitesi) || 0) + 1);
  kayitlar.push({
    ...f,
    fotograf_url: await resimTasi(f.fotograf_url),
    detay_fotograflar: f.detay_fotograflar ? await Promise.all(f.detay_fotograflar.map(resimTasi)) : f.detay_fotograflar,
    il_adi: 'İstanbul',
    ilce_adi: ilceYazimi(site?.ilce_adi) || 'Ümraniye',
    site_id: site?.id ?? null,
  });
}

const siteSayilari = {};
for (const k of kayitlar) siteSayilari[k.sanayi_sitesi || '(yok)'] = (siteSayilari[k.sanayi_sitesi || '(yok)'] || 0) + 1;
console.log('Sanayi sitelerine göre:', siteSayilari);
console.log('Kovan listesinde bulunmayan siteler:', Object.fromEntries(eslesmeyenSiteler));
console.log('İlçeler:', kayitlar.reduce((t, k) => ((t[k.ilce_adi] = (t[k.ilce_adi] || 0) + 1), t), {}));

if (DENEME) {
  console.log('DENEME: hiçbir şey yazılmadı. Örnek kayıt:', JSON.stringify(kayitlar[0], null, 1).slice(0, 900));
  process.exit(0);
}

// 5. Kovan'a yaz (aynı numara varsa günceller)
let yazilan = 0;
for (let i = 0; i < kayitlar.length; i += 200) {
  const parca = kayitlar.slice(i, i + 200);
  const { error } = await kovan.from('firmalar').upsert(parca, { onConflict: 'id' });
  if (error) throw new Error(`Yazma hatası (${i}. kayıttan itibaren): ${error.message}`);
  yazilan += parca.length;
}
console.log(`Kovan'a yazılan firma: ${yazilan}, kopyalanan resim: ${kopyalananResim}`);
