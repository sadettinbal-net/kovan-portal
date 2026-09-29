import Image from "next/image";
import VideoReklamLink from "./VideoReklamLink";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import type { Lang } from "@/lib/translations";
import { getKategoriResim } from "@/lib/kategoriResim";

export interface FirmaKartData {
  id: number;
  ad: string;
  sahip: string;
  sektor: string;
  sanayi_sitesi: string;
  adres: string;
  telefon: string;
  hizmetler: string[];
  ozel_firma: boolean;
  fotograf_url: string | null;
  olumlu_yuzde?: number | null;
  yorum_sayisi?: number;
  ortalama_puan?: number | null;
}

function firmaBasHarfleri(ad: string): string {
  return ad
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(" ");
}

export default async function FirmaKart({ firma }: { firma: FirmaKartData }) {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const t = translations[lang];
  const basHarfler = firmaBasHarfleri(firma.ad);
  const resimUrl = getKategoriResim(firma.sektor);

  return (
    <div
      className={`bg-white rounded-lg border hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full ${
        firma.ozel_firma ? "border-[#e8a020] shadow-sm" : "border-[#dde3ec]"
      }`}
    >
      {firma.ozel_firma && (
        <div className="bg-[#e8a020] text-white text-xs font-semibold px-3 py-1 flex items-center gap-1">
          ⭐ {t.featuredBadge}
        </div>
      )}

      <div className="relative h-[63px] phone:h-[98px] sm:h-[135px] bg-gradient-to-br from-[#eaf3ff] to-[#d0e6ff] overflow-hidden select-none">
        <Image
          src={resimUrl}
          alt={firma.sektor || "Ümraniye Sanayi Sitesi"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 33vw, 33vw"
        />
        <span className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 text-white font-black leading-none tracking-widest text-[12px] phone:text-[15px] sm:text-[21px] bg-[#1a3a6b]/70 px-1 sm:px-1.5 py-0.5 rounded">
          {basHarfler}
        </span>
      </div>

      <div className="p-1 phone:p-1.5 sm:p-3 flex flex-col flex-1">
        <h3 className="font-bold text-[#1a3a6b] text-[8px] phone:text-[11px] sm:text-sm mb-0.5 leading-tight line-clamp-2">
          {firma.ad}
        </h3>

        <div className="space-y-0.5 mb-1 sm:space-y-1 sm:mb-2">
          <div className="flex items-start gap-0.5">
            <span className="text-[#e8a020] text-[8px] phone:text-[10px] sm:text-xs flex-shrink-0">🏷️</span>
            <span className="text-gray-600 text-[8px] phone:text-[10px] sm:text-xs line-clamp-1">{firma.sektor}</span>
          </div>
          <div className="flex items-start gap-0.5">
            <span className="text-[#1a3a6b] text-[8px] phone:text-[10px] sm:text-xs flex-shrink-0">🏭</span>
            <span className="text-gray-600 text-[8px] phone:text-[10px] sm:text-xs line-clamp-1">{firma.sanayi_sitesi}</span>
          </div>
          {firma.yorum_sayisi != null && firma.yorum_sayisi > 0 && firma.ortalama_puan != null && (
            <div className="flex items-center gap-0.5">
              <span className="text-[8px] phone:text-[10px] sm:text-xs">⭐</span>
              <span className="text-[8px] phone:text-[10px] sm:text-xs font-semibold text-[#1a3a6b]">
                {firma.ortalama_puan} / 5
              </span>
              <span className="text-gray-400 text-[7px] phone:text-[9px] sm:text-[10px]">
                ({firma.yorum_sayisi})
              </span>
            </div>
          )}
        </div>

        <VideoReklamLink
          href={`/firma/${firma.id}`}
          kategori={firma.sektor}
          className="block w-full text-center bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-[8px] phone:text-[10px] sm:text-xs py-0.5 phone:py-1 sm:py-1.5 rounded transition-colors mt-auto"
        >
          {t.detailsBtn}
        </VideoReklamLink>
      </div>
    </div>
  );
}
