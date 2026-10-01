import RightSidebar from "@/components/RightSidebar";
import { supabase } from "@/lib/supabase";
import { KURUMSAL_KATEGORILER } from "@/lib/kategoriler-kurumsal";

export default async function RightSidebarWrapper() {
  // Sanayi sitesi dışı firmaları getir (firma_tipi = 'sitesiz' veya eski firmalar için sanayi_sitesi boş)
  const { data: sitesizFirmalar } = await supabase
    .from("firmalar")
    .select("sektor")
    .or("firma_tipi.eq.sitesiz,and(firma_tipi.is.null,or(sanayi_sitesi.is.null,sanayi_sitesi.eq.))")
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi");

  // Sitesiz kategorilere göre grupla
  const kategoriSayilari = new Map<string, number>();
  for (const f of sitesizFirmalar || []) {
    if (!f.sektor) continue;
    kategoriSayilari.set(f.sektor, (kategoriSayilari.get(f.sektor) || 0) + 1);
  }

  const kategoriler = Array.from(kategoriSayilari, ([kategori, sayi]) => ({ kategori, sayi }))
    .sort((a, b) => b.sayi - a.sayi || a.kategori.localeCompare(b.kategori, "tr"));

  // Kurumsal firmaları getir
  const { data: kurumsalFirmalar } = await supabase
    .from("firmalar")
    .select("sektor")
    .eq("firma_tipi", "kurumsal")
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi");

  // Kurumsal kategorileri ana ve alt kategorilere göre grupla
  const kurumsalKategoriSayilari = KURUMSAL_KATEGORILER.map(anaKat => {
    const altKategoriler = anaKat.altlar.map(alt => {
      const sayi = kurumsalFirmalar?.filter(f => f.sektor === alt).length || 0;
      return { kategori: alt, sayi };
    }).filter(k => k.sayi > 0);

    const toplam = altKategoriler.reduce((sum, k) => sum + k.sayi, 0);

    return {
      ana: anaKat.ana,
      altKategoriler,
      toplam
    };
  }).filter(k => k.toplam > 0);

  return (
    <RightSidebar
      kategoriler={kategoriler}
      toplamFirma={sitesizFirmalar?.length || 0}
      kurumsalKategoriler={kurumsalKategoriSayilari}
      toplamKurumsal={kurumsalFirmalar?.length || 0}
    />
  );
}
