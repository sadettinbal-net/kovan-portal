import RightSidebar from "@/components/RightSidebar";
import { supabase } from "@/lib/supabase";
import { aktifKategoriler, kategoriGruplari, type FirmaKategorisi, type KategoriTipi } from "@/lib/firmaKategorileri";

// Sağ menü: Sanayi Dışı ve Kurumsal kategoriler (firma_kategorileri tablosundan), onaylı firma sayılarıyla.
// Firması olmayan kategoriler menüde gösterilmez.
// Sayılar veritabanında hesaplanır (satır çekip saymak Supabase'in 1000 satır sınırına takılıyordu).
type Grup = "sitesiz" | "kurumsal";

// Kategori başına sayılar tek RPC ile (supabase/migrations/20261009010000_firma_kategori_sayilari.sql)
// il verilirse firma_kategori_sayilari_ilce (supabase/migrations/20261101010000_firma_kategori_sayilari_ilce.sql)
// mahalle / sokak da seçildiyse firma_kategori_sayilari_konum (supabase/migrations/20261103000000_firma_kategori_sayilari_konum.sql)
async function kategoriSayilari(il?: string, ilce?: string, mahalle?: number, sokak?: number) {
  const { data } = il
    ? await supabase.rpc("firma_kategori_sayilari_konum", { p_il: il, p_ilce: ilce || null, p_mahalle: mahalle || null, p_sokak: sokak || null })
    : await supabase.rpc("firma_kategori_sayilari");
  const sayilar: Record<Grup, Map<number, number>> = { sitesiz: new Map(), kurumsal: new Map() };
  // Toplam rozet sayısı: grubun bütün satırlarının toplamı (kategorisi boş firmalar dahil).
  // Eskiden firmalar tablosunda ayrıca count: exact ile sayılıyordu (her sayfada ~0,3 sn); sonuç aynı.
  const toplam: Record<Grup, number> = { sitesiz: 0, kurumsal: 0 };
  for (const r of (data || []) as { grup: Grup; kategori_id: number | null; sayi: number }[]) {
    if (r.grup in toplam) toplam[r.grup] += Number(r.sayi);
    if (r.kategori_id) sayilar[r.grup]?.set(Number(r.kategori_id), Number(r.sayi));
  }
  return { sayilar, toplam };
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

// ekReklamSayisi: menünün altına eklenecek ek reklam paneli sayısı
// ekReklamKonumu: ana sayfada "anasayfa_sag", sanayi sitesi sayfasında "site_sag"
// il / ilce: verilirse menüdeki sayılar ve bağlantılar yalnızca o il / ilçenin firmaları içindir (Konuma Göre Ara)
export default async function RightSidebarWrapper({ ekReklamSayisi = 0, ekReklamKonumu = "anasayfa_sag", kategori, il, ilce, mahalle, sokak }: { ekReklamSayisi?: number; ekReklamKonumu?: "anasayfa_sag" | "site_sag" | "tip_sag" | "firmalar_sag"; kategori?: string; il?: string; ilce?: string; mahalle?: string; sokak?: string }) {
  // Mahalle / sokak yalnızca il ve ilçe ile birlikte anlamlı (numarayla gelir)
  const ilceSecili = il && ilce ? ilce : undefined;
  const mahalleNo = ilceSecili ? parseInt(mahalle || "") || undefined : undefined;
  const sokakNo = mahalleNo ? parseInt(sokak || "") || undefined : undefined;
  const [kategoriler, { sayilar, toplam }] = await Promise.all([
    aktifKategoriler(supabase),
    kategoriSayilari(il, ilceSecili, mahalleNo, sokakNo),
  ]);
  const toplamSanayiDisi = toplam.sitesiz;
  const toplamKurumsal = toplam.kurumsal;

  return (
    <RightSidebar
      sanayiDisiKategoriler={grupla(kategoriler, "sanayi_disi", sayilar.sitesiz)}
      toplamSanayiDisi={toplamSanayiDisi}
      kurumsalKategoriler={grupla(kategoriler, "kurumsal", sayilar.kurumsal)}
      toplamKurumsal={toplamKurumsal}
      ekReklamSayisi={ekReklamSayisi}
      ekReklamKonumu={ekReklamKonumu}
      kategori={kategori}
      il={il}
      ilce={ilceSecili}
      mahalle={mahalleNo ? String(mahalleNo) : undefined}
      sokak={sokakNo ? String(sokakNo) : undefined}
    />
  );
}
