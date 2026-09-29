import { supabase } from "@/lib/supabase";
import SidebarClient from "@/components/SidebarClient";

async function tumFirmalariCek() {
  const tumData: { sanayi_sitesi: string | null; sektor: string | null }[] = [];
  const CHUNK = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("firmalar")
      .select("sanayi_sitesi, sektor")
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

export default async function Sidebar() {
  const [firmalar, { count: toplamCount }] = await Promise.all([
    tumFirmalariCek(),
    supabase
      .from("firmalar")
      .select("*", { count: "exact", head: true })
      .not("ad", "ilike", "(Firma%")
      .eq("onay_durumu", "onaylandi"),
  ]);

  const sanayiMap: Record<string, number> = {};
  const kategoriPerSite: Record<string, Record<string, number>> = {};
  const tumKategoriSet = new Set<string>();

  for (const f of firmalar) {
    const site = f.sanayi_sitesi || "Diğer";
    sanayiMap[site] = (sanayiMap[site] || 0) + 1;
    if (f.sektor) {
      tumKategoriSet.add(f.sektor);
      if (!kategoriPerSite[site]) kategoriPerSite[site] = {};
      kategoriPerSite[site][f.sektor] = (kategoriPerSite[site][f.sektor] || 0) + 1;
    }
  }

  const sanayiSiteleri = Object.entries(sanayiMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, firmCount], i) => ({ id: i + 1, name, firmCount }));

  const tumKategoriler = Array.from(tumKategoriSet).sort();

  return (
    <SidebarClient
      sanayiSiteleri={sanayiSiteleri}
      kategoriSayilariPerSite={kategoriPerSite}
      tumKategoriler={tumKategoriler}
      toplamFirma={toplamCount || firmalar.length}
    />
  );
}
