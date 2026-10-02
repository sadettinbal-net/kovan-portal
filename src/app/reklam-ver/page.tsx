import Link from "next/link";
import type { Metadata } from "next";
import { SITE_ADI, SITE_EPOSTA, SITE_TELEFON } from "@/lib/site";

export const metadata: Metadata = {
  title: `Reklam Ver | ${SITE_ADI}`,
  description: `${SITE_ADI} sanayi firma rehberinde reklam alanları ve iletişim bilgileri.`,
};

// Reklam alanlarının kısa tanıtımı; reklam başvurusu telefon, e-posta veya iletişim formuyla alınır.
const ALANLAR = [
  {
    ikon: "🔝",
    ad: "Ana Sayfa Üst Şerit",
    aciklama: "Ana sayfada arama kutusunun hemen altında, sayfa açılır açılmaz görünen geniş yatay alan.",
  },
  {
    ikon: "📌",
    ad: "Kenar Çubuğu",
    aciklama: "Sol menüdeki sanayi siteleri ve ilan kategorilerinin altında, sitenin birçok sayfasında görünen alan.",
  },
  {
    ikon: "🖼️",
    ad: "Sayfa İçi Alan",
    aciklama: "Firma listelerinin arasında görünen alan. Belirli bir kategoriye (ör. oto boyacılar) özel gösterilebilir.",
  },
  {
    ikon: "💬",
    ad: "Firma Sayfası Açılır Pencere",
    aciklama: "Bir firmanın detay sayfası açıldığında gösterilen açılır pencere.",
  },
];

export default function ReklamVerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#1a3a6b]">Anasayfa</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Reklam Ver</span>
      </nav>

      <div className="bg-[#1a3a6b] rounded-xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Reklam Ver</h1>
        <p className="opacity-80 text-sm">
          Firmanızı Türkiye&apos;nin sanayi sitelerindeki ustalara, işletmelere ve müşterilere {SITE_ADI} üzerinden duyurun.
        </p>
      </div>

      <h2 className="font-semibold text-[#1a3a6b] mb-3">Reklam Alanları</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {ALANLAR.map((a) => (
          <div key={a.ad} className="bg-white rounded-xl border border-[#dde3ec] p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{a.ikon}</span>
              <h3 className="font-semibold text-gray-800">{a.ad}</h3>
            </div>
            <p className="text-sm text-gray-600">{a.aciklama}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#dde3ec] p-5">
        <h2 className="font-semibold text-[#1a3a6b] mb-1">Bizimle İletişime Geçin</h2>
        <p className="text-sm text-gray-600 mb-4">Fiyat ve uygun alan bilgisi için bize ulaşın.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`tel:${SITE_TELEFON.replace(/\s/g, "")}`}
            className="flex items-center gap-3 rounded-lg border border-[#dde3ec] p-3 hover:bg-blue-50 transition-colors"
          >
            <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">📞</span>
            <span>
              <span className="block text-xs text-gray-500">Telefon</span>
              <span className="font-semibold text-[#1a3a6b]">{SITE_TELEFON}</span>
            </span>
          </a>
          <a
            href={`mailto:${SITE_EPOSTA}?subject=${encodeURIComponent("Reklam vermek istiyorum")}`}
            className="flex items-center gap-3 rounded-lg border border-[#dde3ec] p-3 hover:bg-blue-50 transition-colors"
          >
            <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">✉️</span>
            <span className="min-w-0">
              <span className="block text-xs text-gray-500">E-posta</span>
              <span className="font-semibold text-[#1a3a6b] text-sm break-all">{SITE_EPOSTA}</span>
            </span>
          </a>
          <Link
            href="/iletisim?konu=reklam"
            className="flex items-center gap-3 rounded-lg bg-[#e8a020] hover:bg-[#c8851a] text-white p-3 transition-colors"
          >
            <span className="w-10 h-10 bg-white/25 rounded-full flex items-center justify-center text-xl flex-shrink-0">📝</span>
            <span>
              <span className="block text-xs opacity-90">İletişim Formu</span>
              <span className="font-semibold">Mesaj Gönder →</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
