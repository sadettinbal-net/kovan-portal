import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "@/lib/supabase";
import { translations, Lang } from "@/lib/translations";
import { SITE_EPOSTA, SITE_KONUM, SITE_URL } from "@/lib/site";

const QR_BASE = "https://api.qrserver.com/v1/create-qr-code";

function qrUrl(data: string) {
  return `${QR_BASE}/?size=110x110&data=${encodeURIComponent(data)}&color=1a3a6b&bgcolor=ffffff&margin=8&ecc=M`;
}

export default async function Footer({ lang = "tr" }: { lang?: Lang }) {
  noStore();
  const t = translations[lang];
  const { count } = await supabase
    .from("firmalar")
    .select("*", { count: "exact", head: true })
    .eq("onay_durumu", "onaylandi");

  return (
    <footer className="bg-[#1a3a6b] text-white mt-8">

      {/* 3 sütun: Logo | Hızlı Erişim | İletişim */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-6 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* 1 — Logo & About */}
        <div>
          <div className="font-bold text-lg text-white mb-1">ÜMRANİYE SANAYİ SİTESİ</div>
          <div className="text-[#e8a020] text-sm font-semibold mb-3">{t.footerTagline}</div>
          <p className="text-gray-300 text-sm">
            {t.footerDesc(count ? `${count}+` : t.footerCountFallback)}
          </p>
        </div>

        {/* 2 — Hızlı Erişim */}
        <div>
          <h3 className="font-semibold text-[#e8a020] mb-3">{t.footerQuickLinks}</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/" className="hover:text-white transition-colors">{t.navHome}</Link></li>
            <li><Link href="/firmalar" className="hover:text-white transition-colors">{t.footerAllCompanies}</Link></li>
            <li><Link href="/ozel-firmalar" className="hover:text-white transition-colors">{t.navFeatured}</Link></li>
            <li><Link href="/ilanlar" className="hover:text-white transition-colors">{t.navListings}</Link></li>
            <li><Link href="/firma-ekle" className="hover:text-white transition-colors">{t.navAddCompany}</Link></li>
            <li><Link href="/iletisim" className="hover:text-white transition-colors">{t.navContact}</Link></li>
          </ul>
        </div>

        {/* 3 — İletişim */}
        <div>
          <h3 className="font-semibold text-[#e8a020] mb-3">{t.footerContact}</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span>📍</span>
              <span>140 Simcoe Street, Toronto, Ontario, Canada</span>
            </li>
            <li className="flex items-center gap-2">
              <span>📞</span>
              <span>+1-(647)-561-41-94 <span className="text-gray-500">(Canada)</span></span>
            </li>
            <li className="border-t border-white/10 pt-2 mt-1 flex items-center gap-2">
              <span>📞</span>
              <span>05353594763 <span className="text-gray-500">(Türkiye)</span></span>
            </li>
            <li className="flex items-center gap-2">
              <span>✉️</span>
              <a href={`mailto:${SITE_EPOSTA}`} className="hover:text-white transition-colors">
                {SITE_EPOSTA}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <span>📍</span>
              <span>{SITE_KONUM}</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Mobil Uygulama — tam genişlik, ortalanmış */}
      <div className="border-t border-white/10 py-6 flex flex-col items-center text-center gap-4">
        <h3 className="font-semibold text-[#e8a020]">{t.footerMobileApp}</h3>
        <p className="text-gray-400 text-sm">{t.footerMobileDesc}</p>

        <div className="flex gap-16 justify-center">
          {/* iOS */}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white rounded-xl p-1.5 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl(SITE_URL)} alt="iOS QR Code" width={110} height={110} loading="lazy" className="rounded-lg" />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-200 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-200">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              iPhone
            </div>
          </div>

          {/* Android */}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white rounded-xl p-1.5 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl(SITE_URL)} alt="Android QR Code" width={110} height={110} loading="lazy" className="rounded-lg" />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-200 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400">
                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24A9.822 9.822 0 0 0 12 8c-1.64 0-3.18.43-4.47 1.18L5.65 5.94c-.19-.28-.55-.36-.83-.22-.3.16-.42.54-.26.85L6.4 9.48A9.981 9.981 0 0 0 2 18h20a9.981 9.981 0 0 0-4.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25S6.31 12.75 7 12.75s1.25.56 1.25 1.25S7.69 15.25 7 15.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
              </svg>
              Android
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm">{t.footerAddToHome}</p>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#0f2548] py-3 px-4 text-center text-xs text-gray-400">
        {t.footerCopyright}
      </div>
    </footer>
  );
}
