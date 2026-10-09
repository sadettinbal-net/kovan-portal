// firma-fotograflari deposundaki 300 KB'tan büyük görselleri küçültür:
// en fazla 1200px genişlik, WebP (kalite 80). Yeni dosyayı yanına yükler, firmalar.fotograf_url ve
// detay_fotograflar adreslerini yeni dosyaya çevirir. Eski dosyaları SİLMEZ; listesini eski-gorseller.json'a yazar.
//
// Kullanım:  node scripts/gorselleri-kucult.mjs          (sadece listeler, değişiklik yapmaz)
//            node scripts/gorselleri-kucult.mjs --uygula (küçültür, yükler, adresleri günceller)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import sharp from 'sharp';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const BUCKET = 'firma-fotograflari';
const SINIR = 300 * 1024;
const GENISLIK = 1200;
const KALITE = 80;
const UYGULA = process.argv.includes('--uygula');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const herkeseAcik = (yol) => supabase.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl;

async function dosyalariListele(klasor = '') {
  const sonuc = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET).list(klasor, { limit: 1000, offset });
    if (error) throw error;
    for (const o of data) {
      const yol = klasor ? `${klasor}/${o.name}` : o.name;
      if (o.id === null) sonuc.push(...(await dosyalariListele(yol))); // alt klasör
      else sonuc.push({ yol, boyut: o.metadata?.size ?? 0 });
    }
    if (data.length < 1000) break;
  }
  return sonuc;
}

const kb = (b) => `${Math.round(b / 1024)} KB`;

async function main() {
  const buyukler = (await dosyalariListele()).filter((d) => d.boyut > SINIR).sort((a, b) => b.boyut - a.boyut);
  console.log(`${buyukler.length} görsel 300 KB'tan büyük.${UYGULA ? '' : ' (Deneme: değişiklik yapılmadı, uygulamak için --uygula)'}\n`);

  const rapor = [];
  for (const d of buyukler) {
    const eskiUrl = herkeseAcik(d.yol);
    const { data: indirilen, error: inHata } = await supabase.storage.from(BUCKET).download(d.yol);
    if (inHata) { console.log(`✗ ${d.yol}: indirilemedi`, inHata.message); continue; }
    const asil = Buffer.from(await indirilen.arrayBuffer());
    const { width } = await sharp(asil).metadata();
    const yeni = await sharp(asil).rotate().resize({ width: GENISLIK, withoutEnlargement: true }).webp({ quality: KALITE }).toBuffer();
    const yeniYol = d.yol.replace(/\.[a-z]+$/i, '') + '-k.webp';
    console.log(`${d.yol}  ${kb(d.boyut)} (${width}px)  →  ${yeniYol}  ${kb(yeni.length)}`);
    if (!UYGULA) continue;

    const { error: yukHata } = await supabase.storage.from(BUCKET).upload(yeniYol, yeni, { contentType: 'image/webp', upsert: true });
    if (yukHata) { console.log('  ✗ yüklenemedi:', yukHata.message); continue; }
    const yeniUrl = herkeseAcik(yeniYol);

    const { data: kartlar } = await supabase.from('firmalar').update({ fotograf_url: yeniUrl }).eq('fotograf_url', eskiUrl).select('id');
    const { data: detaylilar } = await supabase.from('firmalar').select('id, detay_fotograflar').contains('detay_fotograflar', [eskiUrl]);
    for (const f of detaylilar || []) {
      await supabase.from('firmalar').update({ detay_fotograflar: f.detay_fotograflar.map((u) => (u === eskiUrl ? yeniUrl : u)) }).eq('id', f.id);
    }
    const firmalar = [...(kartlar || []).map((f) => f.id), ...(detaylilar || []).map((f) => f.id)];
    console.log(`  ✓ yüklendi; güncellenen firma: ${firmalar.join(', ') || 'yok (hiçbir firma kullanmıyor)'}`);
    rapor.push({ eski: d.yol, eskiBoyutKB: Math.round(d.boyut / 1024), yeni: yeniYol, yeniBoyutKB: Math.round(yeni.length / 1024), firmalar });
  }

  if (UYGULA) {
    fs.writeFileSync('scripts/eski-gorseller.json', JSON.stringify(rapor, null, 2));
    const once = rapor.reduce((t, r) => t + r.eskiBoyutKB, 0);
    const sonra = rapor.reduce((t, r) => t + r.yeniBoyutKB, 0);
    console.log(`\n${rapor.length} görsel küçültüldü: toplam ${once} KB → ${sonra} KB. Eski dosyalar silinmedi, liste: scripts/eski-gorseller.json`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
