import { supabase } from "@/lib/supabase";

// Kovan'ın sanayi siteleri listesi (sanayi_siteleri tablosu) + her sitedeki onaylı firma sayısı.
// Firmaların sanayi_sitesi alanı site adını tutar; tabloda olmayan site adları da (ör. aktarılan firmalar) listeye eklenir.

export type SiteOzeti = { id: number | null; name: string; il: string; ilce: string; firmCount: number };
export type FirmaOzeti = { sanayi_sitesi: string | null; sektor: string | null; il_adi: string | null };

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
    supabase.from("sanayi_siteleri").select("id, site_adi, il_adi, ilce_adi"),
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
    firmCount: firmaSayisi.get(s.site_adi) || 0,
  }));

  // Tabloda olmayan ama firmalarda geçen site adları
  const bilinen = new Set(sonuc.map((s) => s.name));
  for (const [name, firmCount] of firmaSayisi) {
    if (!bilinen.has(name)) sonuc.push({ id: null, name, il: firmaIli.get(name) || "", ilce: "", firmCount });
  }

  return sonuc.sort(
    (a, b) => b.firmCount - a.firmCount || a.il.localeCompare(b.il, "tr") || a.name.localeCompare(b.name, "tr")
  );
}
