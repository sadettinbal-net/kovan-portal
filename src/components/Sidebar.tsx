import { supabase } from "@/lib/supabase";
import SidebarClient from "@/components/SidebarClient";

type FirmaOzet = { sanayi_sitesi: string | null; sektor: string | null; il_adi: string | null };

async function tumFirmalariCek() {
  const tumData: FirmaOzet[] = [];
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

// Sanayi siteleri ve her sitedeki kategori sayıları (verilen firmalardan)
function siteOzeti(firmalar: FirmaOzet[]) {
  const sanayiMap: Record<string, number> = {};
  const kategoriPerSite: Record<string, Record<string, number>> = {};

  for (const f of firmalar) {
    const site = f.sanayi_sitesi || "Diğer";
    sanayiMap[site] = (sanayiMap[site] || 0) + 1;
    if (f.sektor) {
      if (!kategoriPerSite[site]) kategoriPerSite[site] = {};
      kategoriPerSite[site][f.sektor] = (kategoriPerSite[site][f.sektor] || 0) + 1;
    }
  }

  const sanayiSiteleri = Object.entries(sanayiMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, firmCount], i) => ({ id: i + 1, name, firmCount }));

  return { sanayiSiteleri, kategoriPerSite };
}

export default async function Sidebar({ il }: { il?: string }) {
  const tumFirmalar = await tumFirmalariCek();

  // İl listesi (firması olan iller, çoktan aza)
  const ilSayilari: Record<string, number> = {};
  for (const f of tumFirmalar) if (f.il_adi) ilSayilari[f.il_adi] = (ilSayilari[f.il_adi] || 0) + 1;
  const iller = Object.entries(ilSayilari)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .map(([name, firmCount]) => ({ name, firmCount }));

  // İl seçildiyse sanayi siteleri ve sayılar sadece o ilden
  const firmalar = il ? tumFirmalar.filter((f) => f.il_adi === il) : tumFirmalar;
  const { sanayiSiteleri, kategoriPerSite } = siteOzeti(firmalar);
  const tumKategoriler = Array.from(new Set(firmalar.map((f) => f.sektor).filter(Boolean) as string[])).sort();

  return (
    <SidebarClient
      iller={iller}
      sanayiSiteleri={sanayiSiteleri}
      kategoriSayilariPerSite={kategoriPerSite}
      tumKategoriler={tumKategoriler}
      toplamFirma={firmalar.length}
    />
  );
}
