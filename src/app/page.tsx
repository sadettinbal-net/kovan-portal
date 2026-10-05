import Link from "next/link";
import AramaKutusu from "@/components/AramaKutusu";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import type { Lang } from "@/lib/translations";

export const dynamic = "force-dynamic";
import Sidebar from "@/components/Sidebar";
import RightSidebarWrapper from "@/components/RightSidebarWrapper";
import AnasayfaBanner from "@/components/AnasayfaBanner";
import FirmaKart from "@/components/FirmaKart";
import VideoReklam from "@/components/VideoReklam";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";
import { onayliFirmaOzetleri, sanayiSiteleriOzeti } from "@/lib/sanayiSiteleri";
import { aktifSponsorlar } from "@/lib/ozelFirma";

// Anasayfada gösterilen sanayi sitesi sayısı (en çok firması olanlar)
const ANASAYFA_SITE_SAYISI = 20;

export default async function Home() {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];
  const tumSiteler = await sanayiSiteleriOzeti(await onayliFirmaOzetleri());
  // Sadece ana siteler (başka bir sitenin içinde olmayanlar); sayılarına alt siteler dahil
  // Henüz firması olmayan siteler anasayfada gösterilmez (hepsi "Tüm sanayi siteleri" sayfasında)
  const sanayiSiteleri = tumSiteler.filter((s) => s.ustId === null && s.toplamFirma > 0).slice(0, ANASAYFA_SITE_SAYISI);

  // Özel Firmalar: sadece süresi devam eden sponsorlu firmalar. 6'dan fazlaysa her açılışta karışık 6 tanesi
  // gösterilir; böylece ücret ödeyen her firma ana sayfada sırayla yer alır.
  const { data: tumSponsorlar } = await aktifSponsorlar(supabase
    .from("firmalar")
    .select("id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, ozel_firma, fotograf_url, yorum_sayisi, ortalama_puan, olumlu_yuzde, ozel_baslangic, ozel_bitis")
    .eq("onay_durumu", "onaylandi"));
  const ozelFirmalar = [...(tumSponsorlar || [])].sort(() => Math.random() - 0.5).slice(0, 6);

  const { data: sonFirmalar } = await supabase
    .from("firmalar")
    .select("id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, ozel_firma, fotograf_url, yorum_sayisi, ortalama_puan, olumlu_yuzde, ozel_baslangic, ozel_bitis")
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi")
    .order("id", { ascending: false })
    .limit(21);

  const { count } = await supabase.from("firmalar").select("*", { count: "exact", head: true }).eq("onay_durumu", "onaylandi");

  return (
    <>
      <AramaKutusu count={count} />

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <AnasayfaBanner />
        <div className="flex flex-col md:flex-row gap-4">
          <Suspense fallback={<div className="w-72 animate-pulse bg-gray-200 rounded-lg h-96" />}>
            <Sidebar />
          </Suspense>

          <div className="flex-1 min-w-0">
            <section className="mb-6">
              {/* Başlık satırı kartlarla aynı 3 sütun: toplam işletme sayısı ortadaki kartın üstünde */}
              <div className="grid grid-cols-3 gap-1 phone:gap-2 sm:gap-4 items-center mb-3">
                <h2 className="text-[#1a3a6b] font-bold text-lg flex items-center gap-2">
                  {t.featuredSection}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-1 text-center text-[#1a3a6b] font-bold text-[10px] lg:text-xs">
                  <span className="whitespace-nowrap">TOPLAM SANAYİ İŞLETMELERİ</span>
                  <span className="bg-[#e8a020] text-white rounded-full px-1.5 py-0.5">{count || 0}</span>
                </div>
                <Link href="/ozel-firmalar" className="text-sm text-[#1a3a6b] hover:underline justify-self-end">
                  {t.seeAll}
                </Link>
              </div>
              {ozelFirmalar.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 phone:gap-2 sm:gap-4">
                  {ozelFirmalar.map((firma) => (
                    <FirmaKart key={firma.id} firma={firma} />
                  ))}
                </div>
              ) : (
                <Link href="/reklam-ver" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border-2 border-dashed border-[#e8a020] bg-[#fff8ec] hover:bg-[#fff1d6] px-5 py-5 transition-colors">
                  <div>
                    <p className="font-bold text-[#1a3a6b]">{t.promoteTitle}</p>
                    <p className="text-sm text-gray-600">{t.promoteDesc}</p>
                  </div>
                  <span className="bg-[#e8a020] text-white text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap">{t.promoteBtn} →</span>
                </Link>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[#1a3a6b] font-bold text-lg">{t.registeredSection}</h2>
                <Link href="/firmalar" className="text-sm text-[#1a3a6b] hover:underline">
                  {t.seeAll}
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-1 phone:gap-2 sm:gap-4">
                {(sonFirmalar || []).map((firma) => (
                  <FirmaKart key={firma.id} firma={firma} />
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
