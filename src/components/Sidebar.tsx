import SidebarClient from "@/components/SidebarClient";
import { onayliFirmaOzetleri, sanayiSiteleriOzeti } from "@/lib/sanayiSiteleri";

export default async function Sidebar({ il }: { il?: string }) {
  const tumFirmalar = await onayliFirmaOzetleri();
  const tumSiteler = await sanayiSiteleriOzeti(tumFirmalar);

  // İl listesi: sanayi sitesi ya da firması olan iller, alfabetik
  const ilSayilari = new Map<string, { siteCount: number; firmCount: number }>();
  for (const s of tumSiteler) {
    if (!s.il) continue;
    const x = ilSayilari.get(s.il) || { siteCount: 0, firmCount: 0 };
    if (s.id !== null) x.siteCount++;
    ilSayilari.set(s.il, x);
  }
  for (const f of tumFirmalar) {
    if (!f.il_adi) continue;
    const x = ilSayilari.get(f.il_adi) || { siteCount: 0, firmCount: 0 };
    x.firmCount++;
    ilSayilari.set(f.il_adi, x);
  }
  const iller = Array.from(ilSayilari, ([name, sayilar]) => ({ name, ...sayilar })).sort((a, b) =>
    a.name.localeCompare(b.name, "tr")
  );

  // İl seçildiyse sadece o ilin siteleri ve firmaları
  const firmalar = il ? tumFirmalar.filter((f) => f.il_adi === il) : tumFirmalar;
  const siteler = il ? tumSiteler.filter((s) => s.il === il) : tumSiteler;

  const kategoriPerSite: Record<string, Record<string, number>> = {};
  for (const f of firmalar) {
    if (!f.sektor) continue;
    const site = f.sanayi_sitesi || "Diğer";
    kategoriPerSite[site] = kategoriPerSite[site] || {};
    kategoriPerSite[site][f.sektor] = (kategoriPerSite[site][f.sektor] || 0) + 1;
  }
  const tumKategoriler = Array.from(new Set(firmalar.map((f) => f.sektor).filter(Boolean) as string[])).sort();

  return (
    <SidebarClient
      iller={iller}
      sanayiSiteleri={siteler.map((s, i) => ({ id: i + 1, name: s.name, firmCount: s.firmCount, alt: il ? s.ilce : s.il }))}
      kategoriSayilariPerSite={kategoriPerSite}
      tumKategoriler={tumKategoriler}
      toplamFirma={firmalar.length}
    />
  );
}
