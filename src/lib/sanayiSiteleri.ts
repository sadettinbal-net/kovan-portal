import { supabase } from "@/lib/supabase";
import { istanbulMu, istanbulYakasi } from "@/lib/istanbul";

// Kovan'ın sanayi siteleri listesi (sanayi_siteleri tablosu) + her sitedeki onaylı firma sayısı.
// Firmaların sanayi_sitesi alanı site adını tutar; tabloda olmayan site adları da (ör. aktarılan firmalar) listeye eklenir.
// Bir site başka bir sitenin içinde olabilir (ust_site_id); üst sitenin toplamına alt sitelerin firmaları da sayılır.

export type SiteOzeti = {
  id: number | null;
  name: string;
  il: string;
  ilce: string;
  ustId: number | null;
  firmCount: number; // sadece bu sitede kayıtlı firmalar
  toplamFirma: number; // alt siteler dahil
};
export type FirmaOzeti = { sanayi_sitesi: string | null; sektor: string | null; il_adi: string | null };

// Listede gösterilecek satır: grup başlığı (ör. Anadolu Yakası) ya da site (alt siteler girintili)
export type SiteSatiri = { tip: "baslik"; ad: string } | { tip: "site"; site: SiteOzeti; girintili: boolean };

export async function onayliFirmaOzetleri() {
  const tumData: FirmaOzeti[] = [];
  const CHUNK = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("firmalar")
      .select("sanayi_sitesi, sektor, il_adi")
      .not("ad", "ilike", "(Firma%")
      .eq("onay_durumu", "onaylandi")
      .range(from, from + CHUNK - 1);
    if (error || !data || data.length === 0) break;
    tumData.push(...data);
    if (data.length < CHUNK) break;
    from += CHUNK;
  }
  return tumData;
}

// "İSTANBUL" → "İstanbul" (iller tablosundaki yazımla)
function ilAdiEslestirici(iller: { sehir_adi: string }[]) {
  const harita = new Map(iller.map((i) => [i.sehir_adi.toLocaleUpperCase("tr-TR"), i.sehir_adi]));
  return (buyuk: string | null) => (buyuk ? harita.get(buyuk.toLocaleUpperCase("tr-TR")) || buyuk : "");
}

function ilceYazimi(buyuk: string | null) {
  if (!buyuk) return "";
  return buyuk
    .toLocaleLowerCase("tr-TR")
    .replace(/(^|\s)(\S)/g, (_, bosluk: string, harf: string) => bosluk + harf.toLocaleUpperCase("tr-TR"));
}

export async function sanayiSiteleriOzeti(firmalar: FirmaOzeti[]) {
  const [{ data: siteler }, { data: iller }] = await Promise.all([
    supabase.from("sanayi_siteleri").select("id, site_adi, il_adi, ilce_adi, ust_site_id"),
    supabase.from("iller").select("sehir_adi"),
  ]);
  const ilAdi = ilAdiEslestirici(iller || []);

  const firmaSayisi = new Map<string, number>();
  const firmaIli = new Map<string, string>();
  for (const f of firmalar) {
    if (!f.sanayi_sitesi) continue;
    firmaSayisi.set(f.sanayi_sitesi, (firmaSayisi.get(f.sanayi_sitesi) || 0) + 1);
    if (f.il_adi && !firmaIli.has(f.sanayi_sitesi)) firmaIli.set(f.sanayi_sitesi, f.il_adi);
  }

  const sonuc: SiteOzeti[] = (siteler || []).map((s) => ({
    id: s.id,
    name: s.site_adi,
    il: ilAdi(s.il_adi),
    ilce: ilceYazimi(s.ilce_adi),
    ustId: s.ust_site_id ?? null,
    firmCount: firmaSayisi.get(s.site_adi) || 0,
    toplamFirma: 0,
  }));

  // Tabloda olmayan ama firmalarda geçen site adları
  const bilinen = new Set(sonuc.map((s) => s.name));
  for (const [name, firmCount] of firmaSayisi) {
    if (!bilinen.has(name)) sonuc.push({ id: null, name, il: firmaIli.get(name) || "", ilce: "", ustId: null, firmCount, toplamFirma: 0 });
  }

  // Toplam = kendi firmaları + alt sitelerin firmaları
  const altToplam = new Map<number, number>();
  for (const s of sonuc) if (s.ustId !== null) altToplam.set(s.ustId, (altToplam.get(s.ustId) || 0) + s.firmCount);
  for (const s of sonuc) s.toplamFirma = s.firmCount + (s.id !== null ? altToplam.get(s.id) || 0 : 0);

  return sonuc.sort(
    (a, b) => b.toplamFirma - a.toplamFirma || a.il.localeCompare(b.il, "tr") || a.name.localeCompare(b.name, "tr")
  );
}

// Üst sitelerin altına alt sitelerini yerleştir; İstanbul'da Anadolu / Avrupa yakası başlıklarıyla grupla
export function siteSatirlari(siteler: SiteOzeti[], il?: string): SiteSatiri[] {
  const varOlanIdler = new Set(siteler.map((s) => s.id));
  const altlar = new Map<number, SiteOzeti[]>();
  for (const s of siteler) {
    if (s.ustId !== null && varOlanIdler.has(s.ustId)) altlar.set(s.ustId, [...(altlar.get(s.ustId) || []), s]);
  }
  const ustler = siteler.filter((s) => s.ustId === null || !varOlanIdler.has(s.ustId));

  const agac = (liste: SiteOzeti[]): SiteSatiri[] =>
    liste.flatMap((s) => [
      { tip: "site" as const, site: s, girintili: false },
      ...(s.id !== null ? altlar.get(s.id) || [] : []).map((a) => ({ tip: "site" as const, site: a, girintili: true })),
    ]);

  if (!istanbulMu(il)) return agac(ustler);

  const satirlar: SiteSatiri[] = [];
  for (const yaka of ["Anadolu Yakası", "Avrupa Yakası", null] as const) {
    const grup = ustler.filter((s) => istanbulYakasi(s.ilce) === yaka);
    if (grup.length === 0) continue;
    satirlar.push({ tip: "baslik", ad: yaka || "Diğer" }, ...agac(grup));
  }
  return satirlar;
}

// Bir site seçildiğinde firmaları: kendisi + alt siteleri
export async function siteVeAltSiteAdlari(siteAdi: string) {
  const { data: site } = await supabase.from("sanayi_siteleri").select("id").eq("site_adi", siteAdi).limit(1).maybeSingle();
  if (!site) return [siteAdi];
  const { data: altlar } = await supabase.from("sanayi_siteleri").select("site_adi").eq("ust_site_id", site.id);
  return [siteAdi, ...(altlar || []).map((a) => a.site_adi)];
}
