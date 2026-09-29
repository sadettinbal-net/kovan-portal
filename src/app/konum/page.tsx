import Link from "next/link";
import type { Metadata } from "next";
import FirmaKart from "@/components/FirmaKart";
import { supabase } from "@/lib/supabase";
import KonumFiltre from "./KonumFiltre";
import { onayliFirmaOzetleri, sanayiSiteleriOzeti } from "@/lib/sanayiSiteleri";
import BolgeHaritasi, { type HaritaSorgusu } from "@/components/BolgeHaritasi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Konuma Göre Ara | Kovan Portal",
  description: "İl, ilçe, mahalle ve sokağa göre sanayi firmalarını ve sanayi sitelerini bulun.",
};

const LIMIT = 99;

interface PageProps {
  searchParams: Promise<{ il?: string; ilce?: string; mahalle?: string; sokak?: string }>;
}

export default async function KonumPage(props: PageProps) {
  const { il = "", ilce = "", mahalle = "", sokak = "" } = await props.searchParams;
  const mahalleId = parseInt(mahalle) || null;
  const sokakId = parseInt(sokak) || null;

  // Seçilen bölgedeki onaylı firmalar
  let firmalar: import("@/lib/supabase").Firma[] = [];
  let toplam = 0;
  if (il) {
    let sorgu = supabase
      .from("firmalar")
      .select("id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, ozel_firma, fotograf_url", { count: "exact" })
      .eq("onay_durumu", "onaylandi")
      .eq("il_adi", il)
      .order("ozel_firma", { ascending: false })
      .order("ad")
      .limit(LIMIT);
    if (ilce) sorgu = sorgu.eq("ilce_adi", ilce);
    if (mahalleId) sorgu = sorgu.eq("mahalle_id", mahalleId);
    if (sokakId) sorgu = sorgu.eq("sokak_id", sokakId);
    const { data, count } = await sorgu;
    firmalar = (data || []) as import("@/lib/supabase").Firma[];
    toplam = count || 0;
  }

  // Seçilen il/ilçedeki sanayi siteleri
  let siteler: { id: number; site_adi: string; ilce_adi: string | null }[] = [];
  if (il) {
    let sorgu = supabase
      .from("sanayi_siteleri")
      .select("id, site_adi, ilce_adi")
      .eq("il_adi", il.toLocaleUpperCase("tr-TR"))
      .order("site_adi");
    if (ilce) sorgu = sorgu.eq("ilce_adi", ilce.toLocaleUpperCase("tr-TR"));
    const { data } = await sorgu;
    siteler = data || [];
  }

  const bolge = [ilce, il].filter(Boolean).join(" / ");

  // İl seçilmemişse: illere göre sanayi sitesi ve firma sayıları
  const ilOzetleri: { il: string; siteCount: number; firmCount: number }[] = [];
  if (!il) {
    const ozet = new Map<string, { siteCount: number; firmCount: number }>();
    for (const s of await sanayiSiteleriOzeti(await onayliFirmaOzetleri())) {
      if (!s.il) continue;
      const x = ozet.get(s.il) || { siteCount: 0, firmCount: 0 };
      if (s.id !== null) x.siteCount++;
      x.firmCount += s.firmCount;
      ozet.set(s.il, x);
    }
    ilOzetleri.push(
      ...Array.from(ozet, ([ad, x]) => ({ il: ad, ...x })).sort(
        (a, b) => b.firmCount - a.firmCount || b.siteCount - a.siteCount || a.il.localeCompare(b.il, "tr")
      )
    );
  }

  // Harita: en ayrıntılı adresten başlayıp genele doğru aranır
  const [mahalleSonuc, sokakSonuc] = await Promise.all([
    mahalleId
      ? supabase.from("mahalleler_yeni").select("mahalle_adi").eq("mahalle_id", mahalleId).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    sokakId
      ? supabase.from("sokaklar").select("sokak_adi").eq("sokak_id", sokakId).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const mahalleAdi = (mahalleSonuc.data as { mahalle_adi?: string } | null)?.mahalle_adi;
  const sokakAdi = (sokakSonuc.data as { sokak_adi?: string } | null)?.sokak_adi;
  const haritaSorgulari: HaritaSorgusu[] = [];
  if (sokakAdi && mahalleAdi) haritaSorgulari.push({ adres: `${sokakAdi}, ${mahalleAdi}, ${ilce}, ${il}`, yakinlik: 17 });
  if (mahalleAdi) haritaSorgulari.push({ adres: `${mahalleAdi}, ${ilce}, ${il}`, yakinlik: 15 });
  if (ilce) haritaSorgulari.push({ adres: `${ilce}, ${il}`, yakinlik: 12 });
  if (il) haritaSorgulari.push({ adres: il, yakinlik: 9 });
  const haritaEtiketi = [sokakAdi, mahalleAdi, ilce, il].filter(Boolean).join(", ");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#1a3a6b]">Anasayfa</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Konuma Göre Ara</span>
      </nav>

      <div className="bg-[#1a3a6b] rounded-xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-1">📍 Konuma Göre Ara</h1>
        <p className="opacity-80 text-sm">İl, ilçe, mahalle ve sokak seçerek bölgedeki firmaları ve sanayi sitelerini bulun.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#dde3ec] p-5 mb-6">
        <KonumFiltre deger={{ il, ilce, mahalleId: mahalle, sokakId: sokak }} />
      </div>

      {!il ? (
        <section>
          <h2 className="text-lg font-bold text-[#1a3a6b] mb-3">
            🏭 İllere Göre Sanayi Siteleri{" "}
            <span className="text-sm font-normal text-gray-500">({ilOzetleri.reduce((t, i) => t + i.siteCount, 0)} site)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ilOzetleri.map((i) => (
              <Link
                key={i.il}
                href={`/konum?il=${encodeURIComponent(i.il)}`}
                className="bg-white rounded-lg border border-[#dde3ec] hover:border-[#1a3a6b] hover:shadow-sm px-4 py-3 transition"
              >
                <div className="font-semibold text-[#1a3a6b] text-sm">{i.il}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {i.siteCount} sanayi sitesi{i.firmCount ? ` · ${i.firmCount} firma` : ""}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          <BolgeHaritasi sorgular={haritaSorgulari} etiket={haritaEtiketi} />

          {siteler.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-[#1a3a6b] mb-3">
                🏭 {bolge} Sanayi Siteleri <span className="text-sm font-normal text-gray-500">({siteler.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {siteler.map((s) => (
                  <Link
                    key={s.id}
                    href={`/firmalar?il=${encodeURIComponent(il)}&site=${encodeURIComponent(s.site_adi)}`}
                    className="bg-white rounded-lg border border-[#dde3ec] hover:border-[#1a3a6b] hover:shadow-sm px-4 py-3 transition"
                  >
                    <div className="font-semibold text-[#1a3a6b] text-sm">{s.site_adi}</div>
                    {s.ilce_adi && !ilce && <div className="text-xs text-gray-500 mt-0.5">{s.ilce_adi}</div>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-bold text-[#1a3a6b] mb-3">
              🏪 {bolge} Firmaları <span className="text-sm font-normal text-gray-500">({toplam})</span>
            </h2>
            {firmalar.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#dde3ec] p-10 text-center text-gray-500">
                Bu bölgede henüz kayıtlı firma yok.{" "}
                <Link href="/firma-ekle" className="text-[#e8a020] font-semibold hover:underline">
                  Firmanızı ekleyin →
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {firmalar.map((f) => (
                    <FirmaKart key={f.id} firma={f} />
                  ))}
                </div>
                {toplam > LIMIT && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    İlk {LIMIT} firma gösteriliyor. Daha fazlası için mahalle veya sokak seçin.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
