import RightSidebar from "@/components/RightSidebar";
import { supabase } from "@/lib/supabase";

export default async function RightSidebarWrapper() {
  // Sanayi sitesi olmayan firmaları getir
  const { data: firmalar } = await supabase
    .from("firmalar")
    .select("sektor")
    .or("sanayi_sitesi.is.null,sanayi_sitesi.eq.")
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi");

  // Kategorilere göre grupla
  const kategoriSayilari = new Map<string, number>();
  for (const f of firmalar || []) {
    if (!f.sektor) continue;
    kategoriSayilari.set(f.sektor, (kategoriSayilari.get(f.sektor) || 0) + 1);
  }

  const kategoriler = Array.from(kategoriSayilari, ([kategori, sayi]) => ({ kategori, sayi }))
    .sort((a, b) => b.sayi - a.sayi || a.kategori.localeCompare(b.kategori, "tr"));

  return <RightSidebar kategoriler={kategoriler} toplamFirma={firmalar?.length || 0} />;
}
