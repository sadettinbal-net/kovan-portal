import Link from "next/link";
import FirmaKart from "@/components/FirmaKart";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import type { Lang } from "@/lib/translations";

import { aktifSponsorlar, FAVORI_EN_AZ_OLUMLU, FAVORI_EN_AZ_YORUM, OZEL_ALANLAR } from "@/lib/ozelFirma";

export const dynamic = "force-dynamic";

const SECIM_SELECT =
  `id, ad, sahip, sektor, sanayi_sitesi, adres, telefon, hizmetler, fotograf_url, yorum_sayisi, ortalama_puan, olumlu_yuzde, ${OZEL_ALANLAR}`;

// İki bölüm: 💎 Özel Firmalar (yönetici verir, süreli, sponsorlu) ve ⭐ Müşteri Favorileri (puanla, otomatik).
export default async function OzelFirmalarPage() {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];
  const [{ data: sponsorlular }, { data: favoriler }] = await Promise.all([
    aktifSponsorlar(supabase.from("firmalar").select(SECIM_SELECT).eq("onay_durumu", "onaylandi")).order("ad"),
    supabase
      .from("firmalar")
      .select(SECIM_SELECT)
      .eq("onay_durumu", "onaylandi")
      .gte("yorum_sayisi", FAVORI_EN_AZ_YORUM)
      .gte("olumlu_yuzde", FAVORI_EN_AZ_OLUMLU)
      .order("olumlu_yuzde", { ascending: false })
      .order("yorum_sayisi", { ascending: false }),
  ]);

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
        <p className="opacity-90 text-sm">{t.featuredPageDesc}</p>
      </div>

      {/* 💎 Özel Firmalar (Sponsorlu) */}
      <section className="mb-8">
        <h2 className="text-[#1a3a6b] font-bold text-lg mb-3 flex items-center gap-2">
          {t.sponsoredSectionTitle}
          <span className="text-xs font-normal text-gray-400">{t.sponsoredLabel}</span>
        </h2>
        {sponsorlular && sponsorlular.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 phone:gap-2 sm:gap-4">
            {sponsorlular.map((firma) => (
              <FirmaKart key={firma.id} firma={firma} />
            ))}
          </div>
        ) : (
          <Link href="/reklam-ver" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border-2 border-dashed border-[#e8a020] bg-[#fff8ec] hover:bg-[#fff1d6] px-5 py-5 transition-colors">
            <div>
              <p className="font-bold text-[#1a3a6b]">{t.promoteTitle}</p>
              <p className="text-sm text-gray-600">{t.noSponsoredYet} {t.promoteDesc}</p>
            </div>
            <span className="bg-[#e8a020] text-white text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap">{t.promoteBtn} →</span>
          </Link>
        )}
      </section>

      {/* ⭐ Müşteri Favorileri */}
      <section>
        <h2 className="text-[#1a3a6b] font-bold text-lg mb-1">{t.favoritesSectionTitle}</h2>
        <p className="text-sm text-gray-500 mb-3">{t.favoritesSectionDesc}</p>
        {favoriler && favoriler.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 phone:gap-2 sm:gap-4">
            {favoriler.map((firma) => (
              <FirmaKart key={firma.id} firma={firma} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-lg border border-[#dde3ec]">
            <div className="text-4xl mb-2">⭐</div>
            <p className="text-gray-500">{t.noFavoritesYet}</p>
          </div>
        )}
      </section>
    </div>
  );
}
