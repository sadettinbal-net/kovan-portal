import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import FirmaKart from "@/components/FirmaKart";
import VideoReklam from "@/components/VideoReklam";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import { siteVeAltSiteAdlari } from "@/lib/sanayiSiteleri";
import type { Lang } from "@/lib/translations";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    il?: string;
    site?: string;
    sanayi_sitesi?: string;
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
  const { il, site, sanayi_sitesi, kategori, ara } = searchParams;
  const rawLimit = parseInt(searchParams.limit || "") || DEFAULT_LIMIT;
  const limit = LIMIT_OPTIONS.includes(rawLimit) ? rawLimit : DEFAULT_LIMIT;
  const sayfa = Math.max(parseInt(searchParams.sayfa || "") || 1, 1);

  // Türkiye saatine göre (UTC+3) günlük rotasyon — her gece 00:00'da sayfalar bir ileri kayar
  const gunSayisi = Math.floor((Date.now() + 3 * 60 * 60 * 1000) / (1000 * 60 * 60 * 24));

  let query = supabase
    .from("firmalar")
    .select("id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, ozel_firma, fotograf_url, hedef_sayfa")
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi")
    .order("ad");

  if (il) query = query.eq("il_adi", il);
  // Sanayi sitesi olmayan firmalar
  if (sanayi_sitesi === "yok") query = query.or("sanayi_sitesi.is.null,sanayi_sitesi.eq.");
  // Üst site seçildiyse içindeki sitelerin firmaları da gelir
  else if (site) query = query.in("sanayi_sitesi", await siteVeAltSiteAdlari(site));
  if (kategori) query = query.eq("sektor", kategori);

  const tumFirmalarArr: import("@/lib/supabase").Firma[] = [];
  {
    const CHUNK = 1000;
    let from = 0;
    while (true) {
      const { data } = await query.range(from, from + CHUNK - 1);
      if (!data || data.length === 0) break;
      tumFirmalarArr.push(...(data as import("@/lib/supabase").Firma[]));
      if (data.length < CHUNK) break;
      from += CHUNK;
    }
  }

  // Review istatistiklerini çek — admin key ile (RLS'yi bypass eder)
  const { data: tumYorumlar } = await adminClient()
    .from("yorumlar")
    .select("firma_id, puan");

  const statsMap = new Map<number, { toplam: number; olumlu: number; puanToplam: number }>();
  for (const y of tumYorumlar || []) {
    const s = statsMap.get(y.firma_id) || { toplam: 0, olumlu: 0, puanToplam: 0 };
    s.toplam++;
    if (y.puan >= 4) s.olumlu++;
    s.puanToplam += y.puan;
    statsMap.set(y.firma_id, s);
  }

  // FirmaKartData'ya uyumlu genişletilmiş tip
  type FirmaWithStats = import("@/lib/supabase").Firma & {
    olumlu_yuzde: number | null;
    yorum_sayisi: number;
    ortalama_puan: number | null;
  };

  const MIN_YORUM = 1;

  const firmalarWithStats: FirmaWithStats[] = tumFirmalarArr.map((f) => {
    const s = statsMap.get(f.id);
    if (!s || s.toplam < MIN_YORUM) {
      return { ...f, olumlu_yuzde: null, yorum_sayisi: s?.toplam || 0, ortalama_puan: null };
    }
    return {
      ...f,
      olumlu_yuzde: Math.round((s.olumlu / s.toplam) * 100),
      yorum_sayisi: s.toplam,
      ortalama_puan: Math.round((s.puanToplam / s.toplam) * 10) / 10,
    };
  });

  // Sıralama: %75+ olumlu → öne al (puana göre azalan), geri kalanlar alfabetik (DB sırası)
  firmalarWithStats.sort((a, b) => {
    const aOne = a.olumlu_yuzde !== null && a.olumlu_yuzde >= 75;
    const bOne = b.olumlu_yuzde !== null && b.olumlu_yuzde >= 75;
    if (aOne && !bOne) return -1;
    if (!aOne && bOne) return 1;
    if (aOne && bOne) return (b.olumlu_yuzde || 0) - (a.olumlu_yuzde || 0);
    return 0; // DB'den alfabetik geldi, stable sort koruyor
  });

  let firmalar: FirmaWithStats[] = firmalarWithStats;

  if (ara) {
    const tokens = tokenize(ara);
    if (tokens.length > 0) {
      firmalar = firmalar.filter((f) => {
        const haystack = [norm(f.ad), norm(f.sektor || ""), norm(f.sanayi_sitesi || ""), norm(f.sahip || ""), ...(f.hizmetler || []).map(norm)].join(" ");
        return tokens.every((t) => haystack.includes(t));
      });
    }
  }

  // Sayfa sabitleme: hedef_sayfa dolu firmalar ilgili sayfanın başına eklenir
  const sabitFirmalar = firmalar.filter(f => (f as typeof f & { hedef_sayfa?: number | null }).hedef_sayfa);
  const normalFirmalar = firmalar.filter(f => !(f as typeof f & { hedef_sayfa?: number | null }).hedef_sayfa);

  const toplamFirma = normalFirmalar.length;
  const toplamSayfa = Math.max(Math.ceil(toplamFirma / limit), 1);
  const gecerliSayfa = Math.min(sayfa, toplamSayfa);

  // Günlük rotasyon: her gece yarısı sayfa içerikleri bir ileri kayar (1→2, 2→3, ..., son→1)
  const rotasyon = toplamSayfa > 1 ? gunSayisi % toplamSayfa : 0;
  const gercekBaslangic = ((gecerliSayfa - 1 - rotasyon + toplamSayfa) % toplamSayfa) * limit;

  const sayfadakiSabitler = sabitFirmalar.filter(
    f => (f as typeof f & { hedef_sayfa?: number | null }).hedef_sayfa === gecerliSayfa
  );
  const normalSayfaFirmalar = normalFirmalar.slice(gercekBaslangic, gercekBaslangic + limit);
  const sayfaFirmalar = [...sayfadakiSabitler, ...normalSayfaFirmalar];

  const baslik = site || kategori || (ara ? t.resultsFor(ara) : il || t.allCompanies);

  // URL oluşturucu — mevcut filtreleri korur
  const url = (extra: Record<string, string | undefined>) =>
    buildUrl({ il, site, kategori, ara, limit: String(limit), ...extra });

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
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
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
                {t.showing((gecerliSayfa - 1) * limit + 1, Math.min(gecerliSayfa * limit, toplamFirma), toplamFirma)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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
          {(site || kategori || ara) && (
            <div className="flex flex-wrap gap-2 mb-4">
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
                  {t.pageInfo(gecerliSayfa, toplamSayfa, toplamFirma)}
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
      </div>
    </div>
  );
}
