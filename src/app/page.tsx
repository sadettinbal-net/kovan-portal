import Link from "next/link";
import AramaKutusu from "@/components/AramaKutusu";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import type { Lang } from "@/lib/translations";

export const dynamic = "force-dynamic";
import Sidebar from "@/components/Sidebar";
import RightSidebarWrapper from "@/components/RightSidebarWrapper";
import FirmaKart from "@/components/FirmaKart";
import VideoReklam from "@/components/VideoReklam";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { Suspense } from "react";
import { onayliFirmaOzetleri, sanayiSiteleriOzeti } from "@/lib/sanayiSiteleri";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Anasayfada gösterilen sanayi sitesi sayısı (en çok firması olanlar)
const ANASAYFA_SITE_SAYISI = 20;

export default async function Home() {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];
  const tumSiteler = await sanayiSiteleriOzeti(await onayliFirmaOzetleri());
  // Sadece ana siteler (başka bir sitenin içinde olmayanlar); sayılarına alt siteler dahil
  const sanayiSiteleri = tumSiteler.filter((s) => s.ustId === null).slice(0, ANASAYFA_SITE_SAYISI);

  const { data: ozelFirmalar } = await supabase
    .from("firmalar")
    .select("id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, ozel_firma, fotograf_url")
    .eq("ozel_firma", true)
    .eq("onay_durumu", "onaylandi")
    .limit(6);

  const { data: sonFirmalar } = await supabase
    .from("firmalar")
    .select("id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, ozel_firma, fotograf_url")
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi")
    .order("id", { ascending: false })
    .limit(21);

  const { count } = await supabase.from("firmalar").select("*", { count: "exact", head: true }).eq("onay_durumu", "onaylandi");

  const { data: tumYorumlar } = await adminClient().from("yorumlar").select("firma_id, puan");

  const statsMap = new Map<number, { toplam: number; puanToplam: number }>();
  for (const y of tumYorumlar || []) {
    const s = statsMap.get(y.firma_id) || { toplam: 0, puanToplam: 0 };
    s.toplam++;
    s.puanToplam += y.puan;
    statsMap.set(y.firma_id, s);
  }

  const MIN_YORUM = 1;
  function withStats<T extends { id: number }>(firma: T) {
    const s = statsMap.get(firma.id);
    if (!s || s.toplam < MIN_YORUM) return { ...firma, yorum_sayisi: s?.toplam || 0, ortalama_puan: null };
    return {
      ...firma,
      yorum_sayisi: s.toplam,
      ortalama_puan: Math.round((s.puanToplam / s.toplam) * 10) / 10,
    };
  }

  return (
    <>
      <AramaKutusu count={count} />

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Suspense fallback={<div className="w-72 animate-pulse bg-gray-200 rounded-lg h-96" />}>
            <Sidebar />
          </Suspense>

          <div className="flex-1 min-w-0">
            {ozelFirmalar && ozelFirmalar.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[#1a3a6b] font-bold text-lg flex items-center gap-2">
                    {t.featuredSection}
                  </h2>
                  <Link href="/ozel-firmalar" className="text-sm text-[#1a3a6b] hover:underline">
                    {t.seeAll}
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-1 phone:gap-2 sm:gap-4">
                  {ozelFirmalar.map((firma) => (
                    <FirmaKart key={firma.id} firma={withStats(firma)} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[#1a3a6b] font-bold text-lg">{t.registeredSection}</h2>
                <Link href="/firmalar" className="text-sm text-[#1a3a6b] hover:underline">
                  {t.seeAll}
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-1 phone:gap-2 sm:gap-4">
                {(sonFirmalar || []).map((firma) => (
                  <FirmaKart key={firma.id} firma={withStats(firma)} />
                ))}
              </div>
              <div className="text-center mt-6">
                <Link href="/firmalar" className="inline-block bg-[#1a3a6b] hover:bg-[#2554a0] text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  {t.viewAllBtn(count || 0)}
                </Link>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-[#1a3a6b] font-bold text-lg mb-3">{t.industrialZonesSection}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {sanayiSiteleri.map((site) => (
                  <Link
                    key={`${site.id}-${site.name}`}
                    href={`/firmalar?${site.il ? `il=${encodeURIComponent(site.il)}&` : ""}site=${encodeURIComponent(site.name)}`}
                    className="bg-white border border-[#dde3ec] rounded-lg p-3 text-center hover:border-[#1a3a6b] hover:shadow-md transition-all group"
                  >
                    <div className="text-2xl mb-1">🏗️</div>
                    <div className="text-sm font-semibold text-[#1a3a6b] group-hover:text-[#2554a0] leading-tight">
                      {site.name}
                    </div>
                    {site.il && (
                      <div className="text-xs text-gray-400 mt-0.5">{[site.ilce, site.il].filter(Boolean).join(" / ")}</div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">{site.toplamFirma} {t.companiesWord}</div>
                  </Link>
                ))}
              </div>
              {tumSiteler.length > ANASAYFA_SITE_SAYISI && (
                <div className="text-center mt-4">
                  <Link href="/konum" className="inline-block border-2 border-[#1a3a6b] text-[#1a3a6b] hover:bg-[#1a3a6b] hover:text-white px-6 py-2.5 rounded-lg font-semibold transition-colors">
                    Tüm sanayi siteleri ({tumSiteler.length}) →
                  </Link>
                </div>
              )}
            </section>

            <VideoReklam />
          </div>

          <Suspense fallback={<div className="w-72 animate-pulse bg-gray-200 rounded-lg h-96" />}>
            <RightSidebarWrapper />
          </Suspense>
        </div>
      </div>
    </>
  );
}
