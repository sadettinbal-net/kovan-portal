import RightSidebar from "@/components/RightSidebar";
import { supabase } from "@/lib/supabase";
import { aktifKategoriler, kategoriGruplari, type FirmaKategorisi, type KategoriTipi } from "@/lib/firmaKategorileri";

// Sağ menü: Sanayi Dışı ve Kurumsal kategoriler (firma_kategorileri tablosundan), onaylı firma sayılarıyla.
// Firması olmayan kategoriler menüde gösterilmez.
// Sayılar veritabanında hesaplanır (satır çekip saymak Supabase'in 1000 satır sınırına takılıyordu).
type Grup = "sitesiz" | "kurumsal";

// Toplam rozet sayısı: gerçek sayım (count: exact), süzgeçler eskisiyle aynı
async function onayliFirmaSayisi(firmaTipi: Grup) {
  let query = supabase
    .from("firmalar")
    .select("id", { count: "exact", head: true })
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi");
  query =
    firmaTipi === "sitesiz"
      ? query.or("firma_tipi.eq.sitesiz,and(firma_tipi.is.null,or(sanayi_sitesi.is.null,sanayi_sitesi.eq.))")
      : query.eq("firma_tipi", "kurumsal");
  const { count } = await query;
  return count || 0;
}

// Kategori başına sayılar tek RPC ile (supabase/migrations/20261009010000_firma_kategori_sayilari.sql)
async function kategoriSayilari() {
  const { data } = await supabase.rpc("firma_kategori_sayilari");
  const sayilar: Record<Grup, Map<number, number>> = { sitesiz: new Map(), kurumsal: new Map() };
  for (const r of (data || []) as { grup: Grup; kategori_id: number | null; sayi: number }[]) {
    if (r.kategori_id) sayilar[r.grup]?.set(Number(r.kategori_id), Number(r.sayi));
  }
  return sayilar;
}

function grupla(kategoriler: FirmaKategorisi[], tip: KategoriTipi, sayi: Map<number, number>) {
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
  const [kategoriler, sayilar, toplamSanayiDisi, toplamKurumsal] = await Promise.all([
    aktifKategoriler(supabase),
    kategoriSayilari(),
    onayliFirmaSayisi("sitesiz"),
    onayliFirmaSayisi("kurumsal"),
  ]);

  return (
    <RightSidebar
      sanayiDisiKategoriler={grupla(kategoriler, "sanayi_disi", sayilar.sitesiz)}
      toplamSanayiDisi={toplamSanayiDisi}
      kurumsalKategoriler={grupla(kategoriler, "kurumsal", sayilar.kurumsal)}
      toplamKurumsal={toplamKurumsal}
    />
  );
}
