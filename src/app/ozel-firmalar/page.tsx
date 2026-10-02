import Link from "next/link";
import FirmaKart, { FirmaKartData } from "@/components/FirmaKart";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import type { Lang } from "@/lib/translations";

import { ONE_CIKMA_EN_AZ_YORUM } from "@/lib/yorumlar";

export const dynamic = "force-dynamic";

const SECIM_SELECT =
  "id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, ozel_firma, fotograf_url, yorum_sayisi, ortalama_puan, olumlu_yuzde";
const MIN_YORUM = ONE_CIKMA_EN_AZ_YORUM;

export default async function OzelFirmalarPage() {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];
  // Elle seçilen özel firmalar + en az ${MIN_YORUM} yorumla %90+ olumlu olanlar (puan özeti veritabanında hesaplanıyor)
  const [{ data: ozelFirmalar }, { data: yuksekPuanlilar }] = await Promise.all([
    supabase
      .from("firmalar")
      .select(SECIM_SELECT)
      .eq("ozel_firma", true)
      .eq("onay_durumu", "onaylandi"),
    supabase
      .from("firmalar")
      .select(SECIM_SELECT)
      .eq("ozel_firma", false)
      .eq("onay_durumu", "onaylandi")
      .gte("yorum_sayisi", MIN_YORUM)
      .gte("olumlu_yuzde", 90)
      .order("olumlu_yuzde", { ascending: false }),
  ]);

  // Bu firmalar %90+ puanlı → ozel_firma gibi göster
  const yorumlaGelen: FirmaKartData[] = (yuksekPuanlilar || []).map((f) => ({ ...f, ozel_firma: true }));

  const tumOzeller: FirmaKartData[] = [
    ...(ozelFirmalar || []),
    ...yorumlaGelen,
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
