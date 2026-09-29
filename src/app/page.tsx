import Link from "next/link";
import AramaKutusu from "@/components/AramaKutusu";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import type { Lang } from "@/lib/translations";

export const dynamic = "force-dynamic";
import Sidebar from "@/components/Sidebar";
import FirmaKart from "@/components/FirmaKart";
import VideoReklam from "@/components/VideoReklam";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { Suspense } from "react";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function sanayiSiteleriCek() {
  const tumData: { sanayi_sitesi: string | null }[] = [];
  const CHUNK = 1000;
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from("firmalar")
      .select("sanayi_sitesi")
      .not("ad", "ilike", "(Firma%")
      .eq("onay_durumu", "onaylandi")
      .range(from, from + CHUNK - 1);
    if (!data || data.length === 0) break;
    tumData.push(...data);
    if (data.length < CHUNK) break;
    from += CHUNK;
  }
  return tumData;
}

export default async function Home() {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];
  const sanayiRaw = await sanayiSiteleriCek();

  const sanayiMap: Record<string, number> = {};
  for (const f of sanayiRaw) {
    const s = f.sanayi_sitesi || "Diğer";
    sanayiMap[s] = (sanayiMap[s] || 0) + 1;
  }
  const sanayiSiteleri = Object.entries(sanayiMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, firmCount], i) => ({ id: i + 1, name, firmCount }));

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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Suspense fallback={<div className="w-64 animate-pulse bg-gray-200 rounded-lg h-96" />}>
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
                    key={site.id}
                    href={`/firmalar?site=${encodeURIComponent(site.name)}`}
                    className="bg-white border border-[#dde3ec] rounded-lg p-3 text-center hover:border-[#1a3a6b] hover:shadow-md transition-all group"
                  >
                    <div className="text-2xl mb-1">🏗️</div>
                    <div className="text-sm font-semibold text-[#1a3a6b] group-hover:text-[#2554a0] leading-tight">
                      {site.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{site.firmCount} {t.companiesWord}</div>
                  </Link>
                ))}
              </div>
            </section>

            <VideoReklam />
          </div>
        </div>
      </div>
    </>
  );
}
