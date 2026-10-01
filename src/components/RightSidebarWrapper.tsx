import RightSidebar from "@/components/RightSidebar";
import { supabase } from "@/lib/supabase";
import { aktifKategoriler, kategoriGruplari, type FirmaKategorisi, type KategoriTipi } from "@/lib/firmaKategorileri";

// Sağ menü: Sanayi Dışı ve Kurumsal kategoriler (firma_kategorileri tablosundan), onaylı firma sayılarıyla.
// Firması olmayan kategoriler menüde gösterilmez.
async function onayliFirmalar(firmaTipi: "sitesiz" | "kurumsal") {
  let query = supabase
    .from("firmalar")
    .select("kategori_id")
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi");
  query =
    firmaTipi === "sitesiz"
      ? query.or("firma_tipi.eq.sitesiz,and(firma_tipi.is.null,or(sanayi_sitesi.is.null,sanayi_sitesi.eq.))")
      : query.eq("firma_tipi", "kurumsal");
  const { data } = await query;
  return data || [];
}

function grupla(kategoriler: FirmaKategorisi[], tip: KategoriTipi, firmalar: { kategori_id: number | null }[]) {
  const sayi = new Map<number, number>();
  for (const f of firmalar) if (f.kategori_id) sayi.set(f.kategori_id, (sayi.get(f.kategori_id) || 0) + 1);

  return kategoriGruplari(kategoriler, tip)
    .map(({ ana, altlar }) => {
      // Alt kategorisi olmayan ana kategori kendi başına tek satır olarak listelenir
      const satirlar = altlar.length ? altlar : [ana];
      const altKategoriler = satirlar
        .map((k) => ({ kategori: k.ad, sayi: sayi.get(k.id) || 0 }))
        .filter((k) => k.sayi > 0);
      // Altları olan ana kategoriye doğrudan bağlı firma varsa onlar da ana kategorinin adıyla listelenir
      const ananinKendisi = altlar.length ? sayi.get(ana.id) || 0 : 0;
      if (ananinKendisi) altKategoriler.unshift({ kategori: ana.ad, sayi: ananinKendisi });
      return { ana: ana.ad, altKategoriler, toplam: altKategoriler.reduce((t, k) => t + k.sayi, 0) };
    })
    .filter((k) => k.toplam > 0);
}

export default async function RightSidebarWrapper() {
  const [kategoriler, sitesizFirmalar, kurumsalFirmalar] = await Promise.all([
    aktifKategoriler(supabase),
    onayliFirmalar("sitesiz"),
    onayliFirmalar("kurumsal"),
  ]);

  return (
    <RightSidebar
      sanayiDisiKategoriler={grupla(kategoriler, "sanayi_disi", sitesizFirmalar)}
      toplamSanayiDisi={sitesizFirmalar.length}
      kurumsalKategoriler={grupla(kategoriler, "kurumsal", kurumsalFirmalar)}
      toplamKurumsal={kurumsalFirmalar.length}
    />
  );
}
