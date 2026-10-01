"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";

const IlanVerModal = dynamic(() => import("@/components/IlanVerModal"), { ssr: false });
const VideoReklamModal = dynamic(() => import("@/components/VideoReklamModal"), { ssr: false });


type Ilan = {
  id: number;
  baslik: string;
  aciklama: string;
  kategori: string;
  fiyat: string | null;
  telefon: string;
  ilan_veren_ad: string;
  fotograflar: string[] | null;
  onay_durumu: string;
  created_at: string;
};

type User = { id: string; email: string; name: string };

function IlanlarContent() {
  const { t, lang } = useLanguage();
  const ILAN_KATEGORILERI = [
    { id: "arac", name: t.catVehicle },
    { id: "dukkan", name: t.catShop },
    { id: "elaman", name: t.catJob },
    { id: "yedekparca-arayan", name: t.catPartsWanted },
    { id: "yedekparca-satan", name: t.catPartsSelling },
    { id: "imalat", name: t.catManufacturing },
  ];
  const router = useRouter();
  const searchParams = useSearchParams();
  const tip = searchParams.get("tip") || "";

  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [kategoriBayi, setKategoriBayi] = useState<Record<string, number>>({});
  const [yukleniyor, setYukleniyor] = useState(true);
  const [ilanVerAcik, setIlanVerAcik] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [reklamHedef, setReklamHedef] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ user }) => setUser(user || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function getir() {
      setYukleniyor(true);
      const params = new URLSearchParams({ tip });
      const res = await fetch(`/api/ilanlar?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIlanlar(data.ilanlar || []);
        setKategoriBayi(data.kategoriBayi || {});
      }
      setYukleniyor(false);
    }
    getir();
  }, [tip]);

  const detayAc = (id: number) => {
    setReklamHedef(`/ilanlar/${id}`);
  };

  const reklamBitti = useCallback(() => {
    if (reklamHedef) {
      const hedef = reklamHedef;
      setReklamHedef(null);
      router.push(hedef);
    }
  }, [reklamHedef, router]);

  const toplamIlan = Object.values(kategoriBayi).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Video Reklam Modal */}
      {reklamHedef && <VideoReklamModal onTamamlandi={reklamBitti} />}

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#1a3a6b]">{t.breadHome}</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{t.breadListings}</span>
        {tip && (
          <>
            <span className="mx-2">›</span>
            <span className="text-[#1a3a6b] font-medium">{tip}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-[#dde3ec] overflow-hidden">
            <div className="bg-[#e8a020] text-white px-4 py-2.5 font-bold text-[15px] flex items-center justify-between">
              <span>{t.listingCategories}</span>
              <button
                onClick={() => setIlanVerAcik(true)}
                className="bg-white text-[#e8a020] text-xs font-bold px-2.5 py-1 rounded-md hover:bg-yellow-50 transition-colors whitespace-nowrap"
              >
                {t.postListingBtn}
              </button>
            </div>
            <div className="px-2 pt-2">
              <div className="bg-[#1a3a6b] text-white text-center text-xs font-bold tracking-wide rounded-md px-2 py-1.5">
                🏗️ {t.listingForZones}
              </div>
            </div>
            <ul className="p-2 space-y-1.5">
              <li>
                <Link
                  href="/ilanlar"
                  className={`flex justify-between items-center px-3 py-2 text-[15px] font-semibold rounded-md border transition-colors ${
                    !tip ? "bg-[#ffefcc] border-[#e8a020] text-[#1a3a6b]" : "bg-[#fff8eb] border-[#e8a020]/50 hover:bg-[#ffefcc] hover:border-[#e8a020] text-gray-800"
                  }`}
                >
                  <span>{t.allListings}</span>
                  <span className="bg-white text-gray-700 text-xs px-2 py-0.5 rounded-full border border-[#e8a020]/40">
                    {toplamIlan}
                  </span>
                </Link>
              </li>
              {ILAN_KATEGORILERI.map((kat) => (
                <li key={kat.id}>
                  <Link
                    href={`/ilanlar?tip=${encodeURIComponent(kat.name)}`}
                    className={`flex justify-between items-center px-3 py-2 text-[15px] font-semibold rounded-md border transition-colors ${
                      tip === kat.name
                        ? "bg-[#ffefcc] border-[#e8a020] text-[#1a3a6b]"
                        : "bg-[#fff8eb] border-[#e8a020]/50 hover:bg-[#ffefcc] hover:border-[#e8a020] text-gray-800"
                    }`}
                  >
                    <span className="leading-tight">{kat.name}</span>
                    <span className="bg-white text-gray-700 text-xs px-2 py-0.5 rounded-full ml-1 flex-shrink-0 border border-[#e8a020]/40">
                      {kategoriBayi[kat.name] || 0}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-[#dde3ec] rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <h1 className="font-bold text-[#1a3a6b] text-lg">{tip || t.allListings}</h1>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">{t.listingsCount(ilanlar.length)}</span>
              <button
                onClick={() => setIlanVerAcik(true)}
                className="bg-[#e8a020] hover:bg-[#c8851a] text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {t.postListingBtn}
              </button>
            </div>
          </div>

          {yukleniyor ? (
            <div className="bg-white border border-[#dde3ec] rounded-lg p-12 text-center text-gray-400 text-sm">
              {t.loadingText}
            </div>
          ) : ilanlar.length === 0 ? (
            <div className="bg-white border border-[#dde3ec] rounded-lg text-center py-16 px-4">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-lg font-semibold text-[#1a3a6b] mb-2">{t.noListings}</h2>
              <p className="text-gray-500 text-sm mb-5">
                {tip ? t.noListingsInCat : t.noListingsAll}
              </p>
              <button
                onClick={() => setIlanVerAcik(true)}
                className="bg-[#e8a020] hover:bg-[#c8851a] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                {t.firstToPost}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {ilanlar.map((ilan) => (
                <div
                  key={ilan.id}
                  className="bg-white border border-[#dde3ec] rounded-lg p-4 hover:border-[#e8a020] transition-colors"
                >
                  <div className="flex gap-3">
                    {/* Sadece kapak fotoğrafı */}
                    {ilan.fotograflar && ilan.fotograflar.length > 0 && (
                      <div className="flex-shrink-0">
                        <img
                          src={ilan.fotograflar[0]}
                          alt={ilan.baslik}
                          className="w-24 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        {ilan.fotograflar.length > 1 && (
                          <p className="text-center text-xs text-gray-400 mt-0.5">
                            {t.morePhotos(ilan.fotograflar.length - 1)}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#1a3a6b] text-base mb-1">{ilan.baslik}</h3>
                      <p className="text-gray-600 text-sm mb-2 leading-relaxed line-clamp-2">
                        {ilan.aciklama}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                          {ilan.kategori}
                        </span>
                        {ilan.fiyat && (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                            💰 {ilan.fiyat}
                          </span>
                        )}
                        <span className="text-gray-500">📞 {ilan.telefon}</span>
                        <span className="text-gray-400 ml-auto">
                          {new Date(ilan.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detay butonu - alt orta */}
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => detayAc(ilan.id)}
                      className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold px-8 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {t.detailArrow}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {ilanVerAcik && <IlanVerModal onClose={() => setIlanVerAcik(false)} user={user} />}
    </div>
  );
}

export default function IlanlarPage() {
  return (
    <Suspense>
      <IlanlarContent />
    </Suspense>
  );
}
