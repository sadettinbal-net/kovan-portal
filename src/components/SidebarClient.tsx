"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOzelReklam, reklamTikla } from "@/lib/useOzelReklam";


// baslik: grup başlığı satırı (ör. Anadolu Yakası); girintili: bir üst sitenin içindeki site
// ust: içinde bulunduğu sitenin adı (o site ya da kardeşlerinden biri seçiliyken görünür); altSayisi: içindeki site sayısı
type SanayiSitesi = {
  id: number;
  name: string;
  firmCount: number;
  alt?: string;
  baslik?: string;
  girintili?: boolean;
  ust?: string;
  altSayisi?: number;
};
type KategoriSayisi = Record<string, number>;

interface Props {
  iller: { name: string; siteCount: number; firmCount: number }[];
  sanayiSiteleri: SanayiSitesi[];
  kategoriSayilariPerSite: Record<string, KategoriSayisi>;
  tumKategoriler: string[];
  toplamFirma: number;
}

export default function SidebarClient({ iller, sanayiSiteleri, kategoriSayilariPerSite, tumKategoriler, toplamFirma }: Props) {
  const { t } = useLanguage();
  const ILAN_KATEGORILERI = [
    { id: "arac", name: t.catVehicle },
    { id: "dukkan", name: t.catShop },
    { id: "elaman", name: t.catJob },
    { id: "yedekparca-arayan", name: t.catPartsWanted },
    { id: "yedekparca-satan", name: t.catPartsSelling },
    { id: "imalat", name: t.catManufacturing },
  ];
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeIl = searchParams.get("il") || "";
  const activeSite = searchParams.get("site") || "";
  const activeKategori = searchParams.get("kategori") || "";

  // Firmalar sayfası bağlantısı; seçili il korunur
  const firmalarUrl = (extra: Record<string, string> = {}) => {
    const q = new URLSearchParams({ ...(activeIl ? { il: activeIl } : {}), ...extra });
    const s = q.toString();
    return `/firmalar${s ? `?${s}` : ""}`;
  };
  const [sanayiOpen, setSanayiOpen] = useState(false);

  useEffect(() => {
    setSanayiOpen(window.innerWidth >= 768);
  }, []);

  // Yöneticinin tanımladığı kenar çubuğu reklamı (varsa Google yerine bu gösterilir)
  const { reklam: sbReklam, yuklendi: sbYuklendi } = useOzelReklam("sidebar", activeKategori || undefined);
  const sbPushed = useRef(false);
  useEffect(() => {
    if (!sbYuklendi || sbReklam) return;
    if (sbPushed.current) return;
    sbPushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense scripti henüz yüklenmedi
    }
  }, [sbYuklendi, sbReklam]);

  const kategoriSayilari = activeSite ? (kategoriSayilariPerSite[activeSite] || {}) : {};
  const gorunurKategoriler = activeSite
    ? tumKategoriler.filter((k) => (kategoriSayilari[k] || 0) > 0)
    : [];

  return (
    <aside className="w-full md:w-56 flex-shrink-0 space-y-3">
      <div className="bg-white rounded-lg border border-[#dde3ec] overflow-hidden">
        <button
          onClick={() => setSanayiOpen((o) => !o)}
          className="w-full bg-[#1a3a6b] text-white px-3 py-2 font-bold text-sm flex items-center justify-between lg:cursor-default"
        >
          {t.industrialZones}
          <svg className={`w-3 h-3 transition-transform duration-200 lg:hidden ${sanayiOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {iller.length > 0 && (
          <div className={`${sanayiOpen ? "block" : "hidden"} lg:block p-2 border-b border-gray-100`}>
            <select
              value={activeIl}
              onChange={(e) => {
                const il = e.target.value;
                router.push(il ? `/firmalar?il=${encodeURIComponent(il)}` : "/firmalar");
              }}
              aria-label="İl seçin"
              className="w-full border border-[#dde3ec] rounded px-2 py-1.5 text-xs bg-white outline-none focus:border-[#1a3a6b]"
            >
              <option value="">Tüm Türkiye</option>
              {iller.map((il) => (
                <option key={il.name} value={il.name}>
                  {il.name} ({il.siteCount} site{il.firmCount ? `, ${il.firmCount} firma` : ""})
                </option>
              ))}
            </select>
          </div>
        )}

        <ul className={`${sanayiOpen ? "block" : "hidden"} lg:block max-h-[28rem] overflow-y-auto`}>
          <li>
            <Link
              href={firmalarUrl()}
              className={`flex justify-between items-center px-3 py-2 text-sm font-semibold border-b border-gray-100 hover:bg-blue-50 transition-colors ${!activeSite ? "bg-blue-50 text-[#1a3a6b] font-semibold" : "text-gray-700"}`}
            >
              <span>{t.sidebarAll}</span>
              <span className="bg-[#1a3a6b] text-white text-[10px] px-1.5 py-0.5 rounded-full">{toplamFirma}</span>
            </Link>
          </li>

          {sanayiSiteleri.map((site) => {
            if (site.baslik) {
              return (
                <li key={site.id} className="bg-[#eaf3ff] text-[#1a3a6b] px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-b border-[#d0e6ff]">
                  {site.baslik}
                </li>
              );
            }
            const isActive = activeSite === site.name;
            // Alt site: sadece üst sitesi ya da aynı üstün başka bir alt sitesi seçiliyken göster
            const acikUst =
              activeSite !== "" &&
              (activeSite === site.ust || sanayiSiteleri.some((s) => s.name === activeSite && s.ust === site.ust));
            if (site.girintili && !acikUst) return null;
            const acik = !!site.altSayisi && (isActive || sanayiSiteleri.some((s) => s.name === activeSite && s.ust === site.name));
            return (
              <li key={site.id}>
                <Link
                  href={isActive ? firmalarUrl() : firmalarUrl({ site: site.name })}
                  className={`flex justify-between items-center py-2 text-sm font-semibold border-b border-gray-100 hover:bg-blue-50 transition-colors ${site.girintili ? "pl-6 pr-3" : "px-3"} ${isActive ? "bg-blue-50 text-[#1a3a6b] font-bold" : "text-gray-800"}`}
                >
                  <span className="leading-tight">
                    {site.girintili && <span className="text-gray-300 mr-1">└</span>}
                    {!!site.altSayisi && <span className="text-[#e8a020] mr-1">{acik ? "▾" : "▸"}</span>}
                    {site.name}
                    {site.alt && <span className="block text-xs text-gray-500 font-normal">{site.alt}</span>}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-1 flex-shrink-0 ${isActive ? "bg-[#1a3a6b] text-white" : "bg-gray-200 text-gray-700"}`}>
                    {site.firmCount}
                  </span>
                </Link>

                {/* İçinde site olan sitede kategoriler yerine alt siteler açılır */}
                {isActive && !site.altSayisi && gorunurKategoriler.length > 0 && (
                  <ul className="bg-blue-100 border-b border-blue-200">
                    {gorunurKategoriler.map((kat) => (
                      <li key={kat}>
                        <Link
                          href={firmalarUrl({ site: activeSite, kategori: kat })}
                          className={`flex justify-between items-center pl-5 pr-2 py-1.5 text-[10px] border-b border-blue-200/70 hover:bg-blue-200 transition-colors ${activeKategori === kat ? "text-[#1a3a6b] font-semibold bg-blue-200" : "text-gray-700"}`}
                        >
                          <span className="leading-tight">{kat}</span>
                          <span className="bg-white text-gray-600 text-[9px] px-1 py-0.5 rounded-full ml-1 flex-shrink-0 border border-blue-300">
                            {kategoriSayilari[kat]}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-white rounded-lg border border-[#dde3ec] overflow-hidden">
        <div className="bg-[#e8a020] text-white px-3 py-2 font-bold text-sm">{t.listingCategories}</div>
        <ul>
          {ILAN_KATEGORILERI.map((ilan) => (
            <li key={ilan.id}>
              <Link
                href={`/ilanlar?tip=${encodeURIComponent(ilan.name)}`}
                className="flex justify-between items-center px-3 py-2 text-sm font-semibold border-b border-gray-100 hover:bg-yellow-50 transition-colors text-gray-800"
              >
                <span className="leading-tight">{ilan.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Reklam Alanı (özel reklam varsa Google yerine o gösterilir) */}
      <div className="bg-white rounded-lg border border-[#dde3ec] overflow-hidden">
        <div className="bg-gray-100 text-gray-500 px-3 py-1.5 font-semibold text-xs text-center border-b border-[#dde3ec]">
          Reklam
        </div>
        <div className="p-2">
          {sbReklam ? (
            sbReklam.link_url ? (
              <a
                href={sbReklam.link_url}
                target="_blank"
                rel="noopener sponsored"
                onClick={() => reklamTikla(sbReklam.id)}
              >
                <img
                  src={sbReklam.gorsel_url}
                  alt={sbReklam.baslik || "Reklam"}
                  className="w-full h-auto rounded"
                  loading="lazy"
                />
              </a>
            ) : (
              <img
                src={sbReklam.gorsel_url}
                alt={sbReklam.baslik || "Reklam"}
                className="w-full h-auto rounded"
                loading="lazy"
              />
            )
          ) : sbYuklendi ? (
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-8884760724680185"
              data-ad-slot="7684004731"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          ) : null}
        </div>
      </div>
    </aside>
  );
}
