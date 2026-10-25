import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import FirmaKart from "@/components/FirmaKart";
import VideoReklam from "@/components/VideoReklam";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import { siteVeAltSiteAdlari } from "@/lib/sanayiSiteleri";
import type { Lang } from "@/lib/translations";
import KategoriSuzgeci from "@/components/KategoriSuzgeci";
import RightSidebarWrapper from "@/components/RightSidebarWrapper";
import { ONE_CIKMA_EN_AZ_YORUM } from "@/lib/yorumlar";
import { aktifKategoriler, adinKategoriIdleri, saglikUyarisi, KATEGORI_TIPI, type FirmaTipi } from "@/lib/firmaKategorileri";
import AcilUyari from "@/components/AcilUyari";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    il?: string;
    ilce?: string;
    mahalle?: string;
    sokak?: string;
    site?: string;
    sanayi_sitesi?: string;
    firma_tipi?: string;
    kategori?: string;
    ara?: string;
    sayfa?: string;
    limit?: string;
  }>;
}

// Türkçe karakterleri normalize et, noktalama temizle
function norm(s: string): string {
  return s
    .replace(/İ/g, "I").replace(/ı/g, "i")
    .replace(/Ş/g, "S").replace(/ş/g, "s")
    .replace(/Ğ/g, "G").replace(/ğ/g, "g")
    .replace(/Ü/g, "U").replace(/ü/g, "u")
    .replace(/Ö/g, "O").replace(/ö/g, "o")
    .replace(/Ç/g, "C").replace(/ç/g, "c")
    .replace(/[.,!?;:()\-]/g, " ")
    .toLowerCase();
}

function tokenize(s: string): string[] {
  return norm(s).split(/\s+/).filter((t) => t.length > 1);
}

const LIMIT_OPTIONS = [21, 51, 99];
const DEFAULT_LIMIT = 21;

function buildUrl(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return `/firmalar${s ? `?${s}` : ""}`;
}

export default async function FirmalarPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];
  const { il, ilce, mahalle, sokak, site, sanayi_sitesi, firma_tipi, kategori, ara } = searchParams;
  const mahalleId = parseInt(mahalle || "") || null;
  const sokakId = parseInt(sokak || "") || null;
  const rawLimit = parseInt(searchParams.limit || "") || DEFAULT_LIMIT;
  const limit = LIMIT_OPTIONS.includes(rawLimit) ? rawLimit : DEFAULT_LIMIT;
  const sayfa = Math.max(parseInt(searchParams.sayfa || "") || 1, 1);

  // Türkiye saatine göre (UTC+3) günlük rotasyon — her gece 00:00'da sayfalar bir ileri kayar
  const gunSayisi = Math.floor((Date.now() + 3 * 60 * 60 * 1000) / (1000 * 60 * 60 * 24));

  // Firma listesi iki aşamada çekilir (230 bin+ kayıtta sayfa dakikalarca sürüyordu):
  //  1) Süzgece uyan TÜM firmaların yalnızca sıralama/sabitleme/arama için gereken birkaç alanı, paralel paketlerle,
  //  2) Ekranda gösterilecek sayfanın firmalarının tam bilgisi (en fazla limit + sabitlenenler kadar).
  // Süzgeçler her sorguya aynı şekilde uygulanır; Supabase sorgu nesnesi tekrar kullanılamadığı için her seferinde yeniden kurulur.
  type Suzgec = (q: ReturnType<typeof tabanSorgu>) => ReturnType<typeof tabanSorgu>;
  const suzgecler: Suzgec[] = [];
  function tabanSorgu(alanlar: string, sayim = false) {
    return supabase
      .from("firmalar")
      .select(alanlar, sayim ? { count: "exact", head: true } : undefined)
      .not("ad", "ilike", "(Firma%")
      .eq("onay_durumu", "onaylandi");
  }
  const sorgu = (alanlar: string, sayim = false) => suzgecler.reduce((q, f) => f(q), tabanSorgu(alanlar, sayim));
  // Aynı süzgeçlerin veritabanı fonksiyonu (firma_liste) için karşılığı
  const listeParam: Record<string, unknown> = {};

  if (il) { suzgecler.push(q => q.eq("il_adi", il)); listeParam.il = il; }
  // Anasayfa aramasındaki konum seçimi
  if (ilce) { suzgecler.push(q => q.eq("ilce_adi", ilce)); listeParam.ilce = ilce; }
  if (mahalleId) { suzgecler.push(q => q.eq("mahalle_id", mahalleId)); listeParam.mahalle_id = mahalleId; }
  if (sokakId) { suzgecler.push(q => q.eq("sokak_id", sokakId)); listeParam.sokak_id = sokakId; }

  // Konum etiketi için mahalle ve sokak adları
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
  const konumYazisi = ilce ? [sokakAdi, mahalleAdi, ilce, il].filter(Boolean).join(", ") : "";

  // Kategoriler firma_kategorileri tablosundan (süzgeç listesi ve kategori → kategori_id çevirisi)
  const kategoriListesi = await aktifKategoriler(supabase);

  // Firma tipi filtresi (yeni sistem)
  if (firma_tipi === "siteli") {
    suzgecler.push(q => q.eq("firma_tipi", "siteli"));
    listeParam.firma_tipi = "siteli";
  } else if (firma_tipi === "sitesiz") {
    // Sanayi sitesi dışı firmalar
    suzgecler.push(q => q.or("firma_tipi.eq.sitesiz,and(firma_tipi.is.null,or(sanayi_sitesi.is.null,sanayi_sitesi.eq.))"));
    listeParam.firma_tipi = "sitesiz";
  } else if (firma_tipi === "kurumsal") {
    // Kurumsal firmalar
    suzgecler.push(q => q.eq("firma_tipi", "kurumsal"));
    listeParam.firma_tipi = "kurumsal";
  } else if (sanayi_sitesi === "yok") {
    // Eski sistem uyumluluğu
    suzgecler.push(q => q.or("sanayi_sitesi.is.null,sanayi_sitesi.eq."));
    listeParam.eski_sitesiz = true;
  }

  // Üst site seçildiyse içindeki sitelerin firmaları da gelir
  if (site) {
    const siteAdlari = await siteVeAltSiteAdlari(site);
    suzgecler.push(q => q.in("sanayi_sitesi", siteAdlari));
    listeParam.siteler = siteAdlari;
  }
  // Kategori: ana kategori seçildiyse alt kategorilerindeki firmalar da gelir. Tabloda olmayan bir ad gelirse eski sektör yazısıyla aranır.
  let kategoriIdleri: number[] = [];
  if (kategori) {
    const tip = firma_tipi && firma_tipi in KATEGORI_TIPI ? KATEGORI_TIPI[firma_tipi as FirmaTipi] : undefined;
    kategoriIdleri = adinKategoriIdleri(kategoriListesi, kategori, tip);
    const idler = kategoriIdleri;
    suzgecler.push(q => (idler.length ? q.in("kategori_id", idler) : q.eq("sektor", kategori)));
    if (idler.length) listeParam.kategori_idler = idler;
    else listeParam.sektor = kategori;
  }
  // Sağlık kategorisi listeleniyorsa firma listesinin üstünde 112 uyarısı
  const acilUyari = saglikUyarisi(kategoriListesi, kategoriIdleri);

  // 1. aşama: sıralama için gereken hafif bilgiler (arama varsa aranan alanlar da)
  const HAFIF_ALANLAR = "id, ad, sahip, sektor, sanayi_sitesi, hizmetler, hedef_sayfa, yorum_sayisi, olumlu_yuzde";
  const TAM_ALANLAR = "id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, ozel_firma, fotograf_url, hedef_sayfa, yorum_sayisi, ortalama_puan, olumlu_yuzde, ozel_baslangic, ozel_bitis, kullanici_email";
  const tumFirmalarArr: import("@/lib/supabase").Firma[] = [];
  if (!ara) {
    // Arama yoksa: veritabanı ad sırasındaki id listesini ve sıralamayı etkileyen az sayıdaki firmayı tek seferde döndürür
    const { data } = await supabase.rpc("firma_liste", { p: listeParam });
    const sonuc = (data || { idler: [], ozel: [] }) as { idler: number[]; ozel: [number, string | null, number | null, number | null, number | null][] };
    const ozel = new Map(sonuc.ozel.map(([id, sektor, hedef_sayfa, yorum_sayisi, olumlu_yuzde]) => [id, { sektor, hedef_sayfa, yorum_sayisi, olumlu_yuzde }]));
    for (const id of sonuc.idler) {
      const o = ozel.get(id);
      tumFirmalarArr.push({ id, sektor: o?.sektor ?? null, hedef_sayfa: o?.hedef_sayfa ?? null, yorum_sayisi: o?.yorum_sayisi ?? 0, olumlu_yuzde: o?.olumlu_yuzde ?? null } as unknown as import("@/lib/supabase").Firma);
    }
  } else {
    // Arama varsa aranan alanlar da gerekir: paralel paketlerle çekilip burada süzülür
    const CHUNK = 1000;
    const ESZAMANLI = 16;
    const { count } = await sorgu("id", true);
    const paketler: number[] = [];
    for (let from = 0; from < (count ?? 0); from += CHUNK) paketler.push(from);
    for (let i = 0; i < paketler.length; i += ESZAMANLI) {
      const sonuclar = await Promise.all(
        paketler.slice(i, i + ESZAMANLI).map((from) =>
          // id sırasıyla okunur (birincil anahtar indeksi, hızlı); ad sırası aşağıda burada verilir
          sorgu(HAFIF_ALANLAR).order("id").range(from, from + CHUNK - 1)
        )
      );
      for (const { data } of sonuclar) if (data) tumFirmalarArr.push(...(data as unknown as import("@/lib/supabase").Firma[]));
    }
    // Veritabanının (en_US) ad sırasına denk alfabetik sıra; eşit adlarda id
    const harfSirasi = new Intl.Collator("en-US");
    tumFirmalarArr.sort((a, b) => harfSirasi.compare(a.ad || "", b.ad || "") || a.id - b.id);
  }

  // Puan özetleri (yorum sayısı, ortalama, olumlu oranı) veritabanında hesaplanıp firma kaydında tutuluyor.
  type FirmaWithStats = import("@/lib/supabase").Firma;
  const firmalarWithStats: FirmaWithStats[] = [...tumFirmalarArr];

  // Sıralama: en az ${ONE_CIKMA_EN_AZ_YORUM} yorumu olup %75+ olumlu olanlar öne (olumlu oranına göre azalan), geri kalanlar alfabetik (DB sırası)
  const oneCikar = (f: FirmaWithStats) =>
    (f.yorum_sayisi ?? 0) >= ONE_CIKMA_EN_AZ_YORUM && f.olumlu_yuzde != null && f.olumlu_yuzde >= 75;
  // Sanayi sitesi seçildiyse sitenin yönetimi listede hep en üstte
  const yonetim = (f: FirmaWithStats) => !!site && f.sektor === "SANAYİ SİTESİ YÖNETİMİ";
  firmalarWithStats.sort((a, b) => {
    if (yonetim(a) !== yonetim(b)) return yonetim(a) ? -1 : 1;
    const aOne = oneCikar(a);
    const bOne = oneCikar(b);
    if (aOne && !bOne) return -1;
    if (!aOne && bOne) return 1;
    if (aOne && bOne) return (b.olumlu_yuzde || 0) - (a.olumlu_yuzde || 0);
    return 0; // DB'den alfabetik geldi, stable sort koruyor
  });

  let firmalar: FirmaWithStats[] = firmalarWithStats;

  if (ara) {
    const tokens = tokenize(ara);
    if (tokens.length > 0) {
      // Ad, sektör, site ve sahipte kelime parçası yeter; hizmetlerde (çoğu uzun tanıtım yazısı) tam kelime aranır.
      // Yoksa "Hayat Şifa Hastanesi" araması, hizmetlerinde "hayata", "şifa", "hastanesi" geçen başka bir hastaneyi bulur.
      firmalar = firmalar.filter((f) => {
        const haystack = [norm(f.ad), norm(f.sektor || ""), norm(f.sanayi_sitesi || ""), norm(f.sahip || "")].join(" ");
        const hizmetKelimeleri = new Set((f.hizmetler || []).flatMap(tokenize));
        return tokens.every((t) => haystack.includes(t) || hizmetKelimeleri.has(t));
      });
    }
  }

  // Sayfa sabitleme: hedef_sayfa dolu firmalar ilgili sayfanın başına eklenir; o sayfa yoksa son sayfanın başına.
  // Arama, sanayi sitesi ve kategori süzgeçlerinde sabitleme dikkate alınmaz, firma normal sırasında görünür.
  const sabitlemeGecerli = !ara && !site && !kategori;
  const hedefSayfa = (f: FirmaWithStats) => (sabitlemeGecerli ? f.hedef_sayfa ?? null : null);
  const sabitFirmalar = firmalar.filter(f => hedefSayfa(f));
  const normalFirmalar = firmalar.filter(f => !hedefSayfa(f));

  const toplamFirma = normalFirmalar.length;
  // Ekranda yazan toplam: sayfaya sabitlenmiş firmalar dahil bütün firmalar (kenar menüdeki sayıyla aynı)
  const gosterilenToplam = firmalar.length;
  const toplamSayfa = Math.max(Math.ceil(toplamFirma / limit), 1);
  const gecerliSayfa = Math.min(sayfa, toplamSayfa);

  // Öne çıkanlar (sıralamada zaten başta) her gün 1. sayfanın başında sabit durur.
  // Günlük rotasyon sadece geri kalanlara uygulanır: her gece yarısı sayfa blokları bir ileri kayar (1→2, 2→3, ..., son→1).
  const oneCikanlar = normalFirmalar.filter(f => yonetim(f) || oneCikar(f));
  const geriKalan = normalFirmalar.filter(f => !yonetim(f) && !oneCikar(f));
  const kalanSayfa = Math.max(Math.ceil(geriKalan.length / limit), 1);
  const kaydirma = ((kalanSayfa - (gunSayisi % kalanSayfa)) % kalanSayfa) * limit;
  const siraliFirmalar = [...oneCikanlar, ...geriKalan.slice(kaydirma), ...geriKalan.slice(0, kaydirma)];
  const gercekBaslangic = (gecerliSayfa - 1) * limit;

  const sayfadakiSabitler = sabitFirmalar.filter(f => Math.min(hedefSayfa(f)!, toplamSayfa) === gecerliSayfa);
  const normalSayfaFirmalar = siraliFirmalar.slice(gercekBaslangic, gercekBaslangic + limit);
  const sayfaFirmaOzetleri = [...sayfadakiSabitler, ...normalSayfaFirmalar];

  // 2. aşama: yalnızca bu sayfada gösterilecek firmaların tam bilgisi (sıra korunur)
  const sayfaIdleri = sayfaFirmaOzetleri.map((f) => f.id);
  const { data: tamKayitlar } = sayfaIdleri.length
    ? await supabase.from("firmalar").select(TAM_ALANLAR).in("id", sayfaIdleri)
    : { data: [] };
  const tamHarita = new Map(((tamKayitlar || []) as unknown as FirmaWithStats[]).map((f) => [f.id, f]));
  const sayfaFirmalar = sayfaIdleri.map((id) => tamHarita.get(id)).filter((f): f is FirmaWithStats => !!f);

  const baslik = site || kategori || (ara ? t.resultsFor(ara) : konumYazisi || il || t.allCompanies);

  // URL oluşturucu — mevcut filtreleri korur
  const url = (extra: Record<string, string | undefined>) =>
    buildUrl({ il, ilce, mahalle, sokak, site, firma_tipi, kategori, ara, limit: String(limit), ...extra });

  // Sayfa numarası listesi (max 7 sayfa göster)
  const sayfaNumaralari = () => {
    const pages: (number | "...")[] = [];
    if (toplamSayfa <= 7) {
      for (let i = 1; i <= toplamSayfa; i++) pages.push(i);
    } else {
      pages.push(1);
      if (gecerliSayfa > 3) pages.push("...");
      for (let i = Math.max(2, gecerliSayfa - 1); i <= Math.min(toplamSayfa - 1, gecerliSayfa + 1); i++) pages.push(i);
      if (gecerliSayfa < toplamSayfa - 2) pages.push("...");
      pages.push(toplamSayfa);
    }
    return pages;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Suspense fallback={<div className="w-64 animate-pulse bg-gray-200 rounded-lg h-96" />}>
          <Sidebar il={il} />
        </Suspense>

        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-[#1a3a6b]">{t.breadHome}</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700">{t.breadCompanies}</span>
            {(site || kategori) && (
              <>
                <span className="mx-2">›</span>
                <span className="text-[#1a3a6b] font-medium">{site || kategori}</span>
              </>
            )}
          </nav>

          {/* Header — filtre + sayfa başına seçici */}
          <div className="bg-white border border-[#dde3ec] rounded-lg px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-bold text-[#1a3a6b] text-lg">{baslik}</h1>
              <p className="text-gray-500 text-xs mt-0.5">
                {t.showing((gecerliSayfa - 1) * limit + 1, Math.min(gecerliSayfa * limit, gosterilenToplam), gosterilenToplam)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <Suspense fallback={null}>
                <KategoriSuzgeci kategoriler={kategoriListesi} />
              </Suspense>
              <span className="text-gray-500 text-xs">{t.perPage}</span>
              <div className="flex gap-1">
                {LIMIT_OPTIONS.map((l) => (
                  <Link
                    key={l}
                    href={url({ limit: String(l), sayfa: "1" })}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      limit === l
                        ? "bg-[#1a3a6b] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Aktif filtreler */}
          {(site || kategori || ara || konumYazisi) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {konumYazisi && (
                <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  📍 {konumYazisi}
                  <Link href={url({ il: undefined, ilce: undefined, mahalle: undefined, sokak: undefined, sayfa: "1" })} className="ml-1 hover:text-red-500">✕</Link>
                </span>
              )}
              {site && (
                <span className="bg-blue-100 text-[#1a3a6b] text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  🏭 {site}
                  <Link href="/firmalar" className="ml-1 hover:text-red-500">✕</Link>
                </span>
              )}
              {kategori && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  🏷️ {kategori}
                  <Link href="/firmalar" className="ml-1 hover:text-red-500">✕</Link>
                </span>
              )}
              {ara && (
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  🔍 {ara}
                  <Link href="/firmalar" className="ml-1 hover:text-red-500">✕</Link>
                </span>
              )}
            </div>
          )}

          {acilUyari && <AcilUyari tur={acilUyari} className="mb-4" />}

          {/* Eczane kategorisinde bugünün nöbetçi eczanelerine geçiş */}
          {kategori && /^eczane/i.test(kategori.trim()) && (
            <Link
              href="/nobetci-eczaneler"
              className="mb-4 flex items-center justify-between gap-3 bg-[#1a3a6b] hover:bg-[#244a85] text-white rounded-lg px-4 py-3 transition-colors"
            >
              <span className="flex items-center gap-2 font-semibold">
                <span aria-hidden="true">🌙</span> Bugünün Nöbetçi Eczaneleri
                <span className="hidden sm:inline font-normal text-sm opacity-80">— 81 il, her gün güncel</span>
              </span>
              <span aria-hidden="true" className="text-lg">→</span>
            </Link>
          )}

          {/* Firma grid */}
          {sayfaFirmalar.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-1 phone:gap-2 sm:gap-4">
                {sayfaFirmalar.map((firma) => (
                  <FirmaKart key={firma.id} firma={firma} />
                ))}
              </div>

              {/* Pagination */}
              {toplamSayfa > 1 && (
                <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
                  {/* Önceki */}
                  {gecerliSayfa > 1 ? (
                    <Link
                      href={url({ sayfa: String(gecerliSayfa - 1) })}
                      className="px-3 py-2 rounded-lg text-sm bg-white border border-[#dde3ec] text-[#1a3a6b] hover:bg-blue-50 transition-colors"
                    >
                      {t.prevPage}
                    </Link>
                  ) : (
                    <span className="px-3 py-2 rounded-lg text-sm bg-gray-50 border border-gray-200 text-gray-300 cursor-not-allowed">
                      {t.prevPage}
                    </span>
                  )}

                  {/* Sayfa numaraları */}
                  {sayfaNumaralari().map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 text-sm">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={url({ sayfa: String(p) })}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === gecerliSayfa
                            ? "bg-[#1a3a6b] text-white"
                            : "bg-white border border-[#dde3ec] text-gray-700 hover:bg-blue-50"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}

                  {/* Sonraki */}
                  {gecerliSayfa < toplamSayfa ? (
                    <Link
                      href={url({ sayfa: String(gecerliSayfa + 1) })}
                      className="px-3 py-2 rounded-lg text-sm bg-white border border-[#dde3ec] text-[#1a3a6b] hover:bg-blue-50 transition-colors"
                    >
                      {t.nextPage}
                    </Link>
                  ) : (
                    <span className="px-3 py-2 rounded-lg text-sm bg-gray-50 border border-gray-200 text-gray-300 cursor-not-allowed">
                      {t.nextPage}
                    </span>
                  )}
                </div>
              )}

              {/* Alt bilgi + sayfa başına seçici */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3">
                <p className="text-xs text-gray-400">
                  {t.pageInfo(gecerliSayfa, toplamSayfa, gosterilenToplam)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">{t.perPage}</span>
                  <div className="flex gap-1">
                    {LIMIT_OPTIONS.map((l) => (
                      <Link
                        key={l}
                        href={url({ limit: String(l), sayfa: "1" })}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          limit === l
                            ? "bg-[#1a3a6b] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {l}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <VideoReklam kategori={kategori} />
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-[#dde3ec]">
              <div className="text-4xl mb-3">🔍</div>
              <h2 className="text-gray-600 font-semibold mb-1">{t.noResults}</h2>
              <p className="text-gray-400 text-sm mb-4">
                {t.noResultsDesc}
              </p>
              <Link href="/firmalar" className="text-[#1a3a6b] hover:underline text-sm">
                {t.backToAll}
              </Link>
            </div>
          )}
        </div>

        {/* Sağ menü: ana sayfadaki gibi Sanayi Dışı / Kurumsal kategoriler */}
        <Suspense fallback={<div className="w-72 animate-pulse bg-gray-200 rounded-lg h-96" />}>
          <RightSidebarWrapper />
        </Suspense>
      </div>
    </div>
  );
}
