import Link from "next/link";
import FirmaKart, { FirmaKartData } from "@/components/FirmaKart";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import type { Lang } from "@/lib/translations";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const dynamic = "force-dynamic";

const SECIM_SELECT =
  "id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, ozel_firma, fotograf_url";
const MIN_YORUM = 3;

export default async function OzelFirmalarPage() {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];
  const [{ data: ozelFirmalar }, { data: tumYorumlar }] = await Promise.all([
    supabase
      .from("firmalar")
      .select(SECIM_SELECT)
      .eq("ozel_firma", true)
      .eq("onay_durumu", "onaylandi"),
    adminClient().from("yorumlar").select("firma_id, puan"),
  ]);

  // İstatistik haritası
  const statsMap = new Map<number, { toplam: number; olumlu: number; puanToplam: number }>();
  for (const y of tumYorumlar || []) {
    const s = statsMap.get(y.firma_id) || { toplam: 0, olumlu: 0, puanToplam: 0 };
    s.toplam++;
    if (y.puan >= 4) s.olumlu++;
    s.puanToplam += y.puan;
    statsMap.set(y.firma_id, s);
  }

  function withStats(firma: FirmaKartData): FirmaKartData {
    const s = statsMap.get(firma.id);
    if (!s || s.toplam === 0) return firma;
    return {
      ...firma,
      yorum_sayisi: s.toplam,
      ortalama_puan: Math.round((s.puanToplam / s.toplam) * 10) / 10,
    };
  }

  const ozelIds = new Set((ozelFirmalar || []).map((f) => f.id));
  const yuksekPuanliIds: number[] = Array.from(statsMap.entries())
    .filter(([firmaId, s]) =>
      s.toplam >= MIN_YORUM && s.olumlu / s.toplam >= 0.9 && !ozelIds.has(firmaId)
    )
    .map(([firmaId]) => firmaId);

  // Yüksek puanlı ama ozel_firma olmayan firmaları çek
  let yorumlaGelen: FirmaKartData[] = [];
  if (yuksekPuanliIds.length > 0) {
    const { data } = await supabase
      .from("firmalar")
      .select(SECIM_SELECT)
      .in("id", yuksekPuanliIds)
      .eq("onay_durumu", "onaylandi");
    // Bu firmalar %90+ puanlı → ozel_firma gibi göster
    yorumlaGelen = (data || []).map((f) => ({ ...f, ozel_firma: true }));
  }

  const tumOzeller: FirmaKartData[] = [
    ...(ozelFirmalar || []).map(withStats),
    ...yorumlaGelen.map(withStats),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#1a3a6b]">
          {t.breadHome}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{t.featuredPageTitle}</span>
      </nav>

      <div className="bg-gradient-to-r from-[#e8a020] to-[#c8851a] rounded-xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-1">{t.featuredPageTitle}</h1>
        <p className="opacity-90 text-sm">
          {t.featuredPageDesc}
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-5 text-sm text-green-700">
        {t.featuredPageInfo}
      </div>

      {tumOzeller.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 phone:gap-2 sm:gap-4">
          {tumOzeller.map((firma) => (
            <FirmaKart key={firma.id} firma={firma} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-[#dde3ec]">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-gray-500">{t.noFeatured}</p>
        </div>
      )}
    </div>
  );
}
