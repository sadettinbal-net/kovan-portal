import Link from "next/link";
import type { Metadata } from "next";
import FirmaKart from "@/components/FirmaKart";
import { supabase } from "@/lib/supabase";
import { aktifSponsorlar, OZEL_ALANLAR } from "@/lib/ozelFirma";
import KonumFiltre from "./KonumFiltre";
import { onayliFirmaOzetleri, sanayiSiteleriOzeti, siteSatirlari, type SiteOzeti } from "@/lib/sanayiSiteleri";
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
    const bolgeSorgusu = () => {
      let sorgu = supabase
        .from("firmalar")
        .select(`id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, fotograf_url, yorum_sayisi, ortalama_puan, olumlu_yuzde, ${OZEL_ALANLAR}`, { count: "exact" })
        .eq("onay_durumu", "onaylandi")
        .eq("il_adi", il);
      if (ilce) sorgu = sorgu.eq("ilce_adi", ilce);
      if (mahalleId) sorgu = sorgu.eq("mahalle_id", mahalleId);
      if (sokakId) sorgu = sorgu.eq("sokak_id", sokakId);
      return sorgu;
    };
    // Süresi devam eden sponsorlu (Özel) firmalar başta, geri kalanlar alfabetik
    const { data: sponsorlar } = await aktifSponsorlar(bolgeSorgusu()).order("ad").limit(LIMIT);
    const sponsorIdleri = (sponsorlar || []).map((f) => f.id);
    let digerleri = bolgeSorgusu().order("ad").limit(Math.max(LIMIT - sponsorIdleri.length, 0));
    if (sponsorIdleri.length) digerleri = digerleri.not("id", "in", `(${sponsorIdleri.join(",")})`);
    const { data, count } = await digerleri;
    firmalar = [...(sponsorlar || []), ...(data || [])] as import("@/lib/supabase").Firma[];
    toplam = (count || 0) + sponsorIdleri.length;
  }

  // Seçilen il/ilçedeki sanayi siteleri: gruplar (İstanbul'da yakalar) → üst siteler → içindeki siteler
  const buyuk = (s: string) => s.toLocaleUpperCase("tr-TR");
  const siteGruplari: { baslik: string | null; siteler: { site: SiteOzeti; altlar: SiteOzeti[] }[] }[] = [];
  let siteSayisi = 0;
  if (il) {
    const tumSiteler = await sanayiSiteleriOzeti(await onayliFirmaOzetleri());
    const bolgedekiler = tumSiteler.filter(
      (s) => s.id !== null && buyuk(s.il) === buyuk(il) && (!ilce || buyuk(s.ilce) === buyuk(ilce))
    );
    siteSayisi = bolgedekiler.length;
    for (const satir of siteSatirlari(bolgedekiler, il)) {
      if (satir.tip === "baslik") siteGruplari.push({ baslik: satir.ad, siteler: [] });
      else {
        if (siteGruplari.length === 0) siteGruplari.push({ baslik: null, siteler: [] });
        const grup = siteGruplari[siteGruplari.length - 1];
        if (satir.girintili) grup.siteler[grup.siteler.length - 1]?.altlar.push(satir.site);
        else grup.siteler.push({ site: satir.site, altlar: [] });
      }
    }
  }
  const siteLinki = (ad: string) => `/firmalar?il=${encodeURIComponent(il)}&site=${encodeURIComponent(ad)}`;

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

          {siteSayisi > 0 && (
            <section>
              <h2 className="text-lg font-bold text-[#1a3a6b] mb-3">
                🏭 {bolge} Sanayi Siteleri <span className="text-sm font-normal text-gray-500">({siteSayisi})</span>
              </h2>
              <div className="space-y-5">
                {siteGruplari.map((grup, gi) => (
                  <div key={grup.baslik || gi}>
                    {grup.baslik && (
                      <h3 className="text-sm font-bold uppercase tracking-wide text-[#2554a0] mb-2">
                        {grup.baslik} <span className="font-normal text-gray-400">({grup.siteler.reduce((t, s) => t + 1 + s.altlar.length, 0)})</span>
                      </h3>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {grup.siteler.map(({ site, altlar }) => (
                        <div
                          key={`${site.id}-${site.name}`}
                          className={`bg-white rounded-lg border border-[#dde3ec] ${altlar.length ? "sm:col-span-2 lg:col-span-3" : ""}`}
                        >
                          <Link href={siteLinki(site.name)} className="block px-4 py-3 hover:bg-[#f4f6f9] rounded-lg transition">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-[#1a3a6b] text-sm">{site.name}</span>
                              <span className="text-xs text-gray-500 flex-shrink-0">{site.toplamFirma} firma</span>
                            </div>
                            {site.ilce && !ilce && <div className="text-xs text-gray-500 mt-0.5">{site.ilce}</div>}
                          </Link>
                          {altlar.length > 0 && (
                            <details className="group border-t border-[#dde3ec] px-4 py-3">
                              <summary className="cursor-pointer list-none text-sm font-semibold text-[#e8a020] hover:text-[#c8851a] select-none">
                                <span className="inline-block transition-transform group-open:rotate-90 mr-1">▸</span>
                                İçindeki sanayi siteleri ({altlar.length})
                              </summary>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                                {altlar.map((a) => (
                                  <Link
                                    key={`${a.id}-${a.name}`}
                                    href={siteLinki(a.name)}
                                    className="flex items-center justify-between gap-2 rounded-md border border-[#dde3ec] hover:border-[#1a3a6b] px-3 py-2 text-sm transition"
                                  >
                                    <span className="text-[#1a3a6b]">{a.name}</span>
                                    <span className="text-xs text-gray-500 flex-shrink-0">{a.firmCount}</span>
                                  </Link>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
