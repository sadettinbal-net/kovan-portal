import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { translations } from "@/lib/translations";
import type { Lang } from "@/lib/translations";
import VideoReklam from "@/components/VideoReklam";
import FirmaOwnerPanel from "@/components/FirmaOwnerPanel";
import YorumBolumu from "@/components/YorumBolumu";
import VideoReklamLink from "@/components/VideoReklamLink";
import FotoGaleri from "@/components/FotoGaleri";
import BolgeHaritasi, { type HaritaSorgusu } from "@/components/BolgeHaritasi";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return 'https://' + url;
}

function normalizeTikTokUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.includes('tiktok.com')) return 'https://' + url;
  const username = url.startsWith('@') ? url : '@' + url;
  return 'https://www.tiktok.com/' + username;
}

export default async function FirmaDetay({ params }: PageProps) {
  const id = parseInt((await params).id);
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];

  const { data: firma } = await supabase
    .from("firmalar")
    .select("*")
    .eq("id", id)
    .single();

  if (!firma) notFound();

  const { data: benzerFirmalar } = await supabase
    .from("firmalar")
    .select("id, ad, sanayi_sitesi")
    .eq("sektor", firma.sektor)
    .neq("id", id)
    .limit(3);

  const { data: puanlar } = await supabase
    .from("yorumlar")
    .select("puan")
    .eq("firma_id", id);

  const yorumSayisi = puanlar?.length ?? 0;
  const ortalamaPuan = yorumSayisi > 0
    ? Math.round((puanlar!.reduce((t, y) => t + y.puan, 0) / yorumSayisi) * 10) / 10
    : null;

  const hasSosyal = firma.instagram || firma.facebook || firma.twitter || firma.youtube || firma.linkedin || firma.tiktok;

  // Harita: önce açık adres, sonra sanayi sitesi, sonra ilçe ve il aranır
  const bolgeEki = [firma.ilce_adi, firma.il_adi].filter(Boolean).join(", ");
  const ekle = (metin: string) => [metin, bolgeEki].filter(Boolean).join(", ");
  const haritaSorgulari: HaritaSorgusu[] = [
    ...(firma.adres ? [{ adres: ekle(firma.adres), yakinlik: 17 }] : []),
    ...(firma.sanayi_sitesi ? [{ adres: ekle(firma.sanayi_sitesi), yakinlik: 16 }] : []),
    ...(firma.ilce_adi && firma.il_adi ? [{ adres: bolgeEki, yakinlik: 13 }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#1a3a6b]">{t.breadHome}</Link>
        <span className="mx-2">›</span>
        <Link href="/firmalar" className="hover:text-[#1a3a6b]">{t.breadCompanies}</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{firma.ad}</span>
      </nav>

      <div className="bg-white rounded-xl border border-[#dde3ec] overflow-hidden shadow-sm mb-6">
        {firma.ozel_firma && (
          <div className="bg-[#e8a020] text-white px-6 py-2 text-sm font-semibold">
            ⭐ {t.featuredBadge}
          </div>
        )}

        {firma.fotograf_url && (
          <div className="relative w-full h-64">
            <Image
              src={firma.fotograf_url}
              alt={firma.ad}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        )}

        {firma.detay_fotograflar && firma.detay_fotograflar.length > 0 && (
          <div className="px-6 pt-5">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">{t.photosSection}</h2>
            <FotoGaleri fotograflar={firma.detay_fotograflar} firmaAd={firma.ad} />
          </div>
        )}

        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-[#1a3a6b] mb-4">{firma.ad}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">{t.categoryLabel}</div>
              <div className="font-semibold text-[#1a3a6b]">{firma.sektor}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">{t.industrialZoneLabel}</div>
              <div className="font-semibold text-[#1a3a6b]">{firma.sanayi_sitesi || "—"}</div>
              {(firma.ilce_adi || firma.il_adi) && (
                <div className="text-sm text-gray-600 mt-0.5">📍 {[firma.ilce_adi, firma.il_adi].filter(Boolean).join(" / ")}</div>
              )}
              {ortalamaPuan !== null && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={i <= Math.round(ortalamaPuan) ? "text-yellow-400" : "text-gray-300"}>
                        {i <= Math.round(ortalamaPuan) ? "⭐" : "☆"}
                      </span>
                    ))}
                  </span>
                  <span className="text-sm font-bold text-[#1a3a6b]">{ortalamaPuan} / 5</span>
                  <span className="text-xs text-gray-400">({yorumSayisi})</span>
                </div>
              )}
            </div>
          </div>

          {firma.aciklama && (
            <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-[#dde3ec]">
              <h2 className="font-semibold text-gray-700 text-sm mb-2">{t.aboutCompany}</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{firma.aciklama}</p>
            </div>
          )}

          {firma.sahip && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">👤</span>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">{t.ownerLabel}</div>
                <div className="text-gray-700 text-sm font-medium">{firma.sahip}</div>
              </div>
            </div>
          )}

          {firma.adres && (
            <div className="flex items-start gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">📍</span>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">{t.addressLabel}</div>
                <div className="text-gray-700 text-sm">{firma.adres}</div>
              </div>
            </div>
          )}

          {firma.telefon && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">📞</span>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">{t.phoneLabel}</div>
                <a href={`tel:${firma.telefon}`} className="text-green-700 font-semibold hover:underline">
                  {firma.telefon}
                </a>
              </div>
            </div>
          )}

          {firma.mobil_telefon && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">📲</span>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">{t.mobilePhoneLabel}</div>
                <a href={`tel:${firma.mobil_telefon}`} className="text-green-700 font-semibold hover:underline">
                  {firma.mobil_telefon}
                </a>
              </div>
            </div>
          )}

          {firma.web_sitesi && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">🌐</span>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">{t.websiteLabel}</div>
                <a
                  href={normalizeUrl(firma.web_sitesi)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a3a6b] font-semibold hover:underline text-sm break-all"
                >
                  {firma.web_sitesi}
                </a>
              </div>
            </div>
          )}

          {firma.plus_code && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">📍</span>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Plus Code (Google Haritalar)</div>
                <a
                  href={`https://plus.codes/${firma.plus_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a3a6b] font-semibold hover:underline text-sm"
                >
                  {firma.plus_code}
                </a>
              </div>
            </div>
          )}

          {hasSosyal && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">📱</span>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-2">{t.socialLabel}</div>
                <div className="flex flex-wrap gap-2">
                  {firma.instagram && (
                    <a
                      href={normalizeUrl(firma.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                      Instagram
                    </a>
                  )}
                  {firma.facebook && (
                    <a
                      href={normalizeUrl(firma.facebook)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-[#1877f2] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </a>
                  )}
                  {firma.twitter && (
                    <a
                      href={normalizeUrl(firma.twitter)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X (Twitter)
                    </a>
                  )}
                  {firma.youtube && (
                    <a
                      href={normalizeUrl(firma.youtube)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-[#ff0000] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      YouTube
                    </a>
                  )}
                  {firma.linkedin && (
                    <a
                      href={normalizeUrl(firma.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-[#0077b5] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>
                  )}
                  {firma.tiktok && (
                    <a
                      href={normalizeTikTokUrl(firma.tiktok)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
                      </svg>
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {firma.hizmetler && firma.hizmetler.length > 0 && (
            <div className="mt-4">
              <h2 className="font-semibold text-gray-700 mb-2">{t.servicesTitle}</h2>
              <div className="flex flex-wrap gap-2">
                {firma.hizmetler.map((h: string) => (
                  <span key={h} className="bg-[#1a3a6b] text-white text-sm px-3 py-1 rounded-full">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {haritaSorgulari.length > 0 && (
            <div className="mt-5">
              <BolgeHaritasi sorgular={haritaSorgulari} etiket={firma.ad} yukseklik={260} />
            </div>
          )}
        </div>

        <div className="border-t border-[#dde3ec] px-6 py-4 flex flex-wrap gap-3">
          {firma.telefon && (
            <a href={`tel:${firma.telefon.split('|')[0].trim()}`} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
              {t.callBtn}
            </a>
          )}
          {firma.mobil_telefon && (
            <a href={`tel:${firma.mobil_telefon.split('|')[0].trim()}`} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
              {t.mobileCallBtn}
            </a>
          )}
          {firma.mobil_telefon && (
            <a href={`https://wa.me/90${firma.mobil_telefon.split('|')[0].trim().replace(/^0/, "")}`} target="_blank" rel="noopener noreferrer" className="bg-[#25d366] hover:bg-[#1fba58] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
          {firma.web_sitesi && (
            <a
              href={normalizeUrl(firma.web_sitesi)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {t.websiteBtn}
            </a>
          )}
          {firma.sanayi_sitesi && (
            <Link href={`/firmalar?site=${encodeURIComponent(firma.sanayi_sitesi)}`} className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              🏭 {firma.sanayi_sitesi} {t.siteCompanies}
            </Link>
          )}
        </div>

        <FirmaOwnerPanel
          firmaId={firma.id}
          kullaniciEmail={firma.kullanici_email}
          firma={{
            ad: firma.ad,
            sahip: firma.sahip || '',
            sektor: firma.sektor,
            sanayi_sitesi: firma.sanayi_sitesi,
            telefon: firma.telefon,
            mobil_telefon: firma.mobil_telefon || '',
            adres: firma.adres || '',
            hizmetler: firma.hizmetler || [],
            aciklama: firma.aciklama || '',
            web_sitesi: firma.web_sitesi || '',
            instagram: firma.instagram || '',
            facebook: firma.facebook || '',
            twitter: firma.twitter || '',
            youtube: firma.youtube || '',
            linkedin: firma.linkedin || '',
            tiktok: firma.tiktok || '',
          }}
          fotografUrl={firma.fotograf_url || null}
          detayFotograflar={firma.detay_fotograflar || []}
          bekleyenDegisiklikler={firma.bekleyen_degisiklikler || null}
        />
      </div>

      <YorumBolumu firmaId={firma.id} />

      <VideoReklam kategori={firma.sektor} />

      {benzerFirmalar && benzerFirmalar.length > 0 && (
        <section>
          <h2 className="font-bold text-[#1a3a6b] text-lg mb-3">
            {t.similarCompanies} ({firma.sektor})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {benzerFirmalar.map((f) => (
              <VideoReklamLink key={f.id} href={`/firma/${f.id}`} kategori={firma.sektor} className="bg-white border border-[#dde3ec] rounded-lg p-4 hover:shadow-md hover:border-[#1a3a6b] transition-all text-left w-full">
                <div className="font-semibold text-[#1a3a6b] text-sm mb-1">{f.ad}</div>
                <div className="text-gray-500 text-xs">{f.sanayi_sitesi}</div>
              </VideoReklamLink>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
