"use client";

import { useRef } from "react";
import { useReklamGorunme } from "@/lib/reklamIzleme";

// Reklam görseli + (varsa) üstüne ya da yanına şerit olarak yazılan yazı.
// Sitedeki bütün özel reklam alanları ve yönetici panelindeki önizleme bunu kullanır.

export type YaziKonumu = "ust" | "orta" | "alt" | "ust_serit" | "alt_serit" | "serbest";
export type YaziRengi = "beyaz" | "siyah" | "sari" | "lacivert" | "kirmizi";
export type YaziBoyutu = "kucuk" | "orta" | "buyuk";
export type YaziYonu = "yatay" | "yukaridan_asagi" | "asagidan_yukari";

export const YAZI_KONUMLARI: { deger: YaziKonumu; ad: string }[] = [
  { deger: "serbest", ad: "İstediğim yere (önizlemede sürükleyerek)" },
  { deger: "ust", ad: "Resmin üstünde – üst kısım" },
  { deger: "orta", ad: "Resmin üstünde – ortada" },
  { deger: "alt", ad: "Resmin üstünde – alt kısım" },
  { deger: "ust_serit", ad: "Ayrı şerit – resmin üstünde (dikey yazıda solunda)" },
  { deger: "alt_serit", ad: "Ayrı şerit – resmin altında (dikey yazıda sağında)" },
];
export const YAZI_YONLERI: { deger: YaziYonu; ad: string }[] = [
  { deger: "yatay", ad: "Yatay (soldan sağa)" },
  { deger: "yukaridan_asagi", ad: "Dikey – yukarıdan aşağı" },
  { deger: "asagidan_yukari", ad: "Dikey – aşağıdan yukarı" },
];
export const YAZI_RENKLERI: { deger: YaziRengi; ad: string }[] = [
  { deger: "beyaz", ad: "Beyaz" },
  { deger: "siyah", ad: "Siyah" },
  { deger: "sari", ad: "Sarı" },
  { deger: "lacivert", ad: "Lacivert" },
  { deger: "kirmizi", ad: "Kırmızı" },
];
export const YAZI_BOYUTLARI: { deger: YaziBoyutu; ad: string }[] = [
  { deger: "kucuk", ad: "Küçük" },
  { deger: "orta", ad: "Orta" },
  { deger: "buyuk", ad: "Büyük" },
];

const RENK: Record<YaziRengi, string> = {
  beyaz: "#ffffff",
  siyah: "#111111",
  sari: "#ffd166",
  lacivert: "#1a3a6b",
  kirmizi: "#d62828",
};
// Açık renk yazının arkasına koyu, koyu renk yazının arkasına açık zemin (okunaklı olsun)
const ACIK_RENK: YaziRengi[] = ["beyaz", "sari"];
const BOYUT: Record<YaziBoyutu, string> = {
  kucuk: "text-xs",
  orta: "text-sm md:text-base",
  buyuk: "text-base md:text-xl",
};

export type ReklamYazisi = {
  yazi?: string | null;
  yazi_konum?: string | null;
  yazi_renk?: string | null;
  yazi_boyut?: string | null;
  yazi_yon?: string | null;
  yazi_x?: number | null;
  yazi_y?: number | null;
  yazi_aci?: number | null;
  yazi_yay?: number | null;
};

const sinirla = (n: unknown, varsayilan = 50, alt = 0, ust = 100) => {
  const s = Number(n);
  return Number.isFinite(s) ? Math.min(ust, Math.max(alt, s)) : varsayilan;
};

// Yay şeklinde yazı: yazı bir kavisin (SVG yolu) üzerine dizilir.
// yay > 0: yukarı doğru kavis (∩), yay < 0: aşağı doğru kavis (∪). Satırlar tek satır olarak birleştirilir.
const YAY_PUNTO: Record<YaziBoyutu, number> = { kucuk: 13, orta: 16, buyuk: 22 };
function YayliYazi({ metin, yay, punto, renk, acik }: { metin: string; yay: number; punto: number; renk: string; acik: boolean }) {
  const tekSatir = metin.replace(/\s*\n\s*/g, " ");
  const genislik = Math.max(60, tekSatir.length * punto * 0.62);
  const sehim = (Math.abs(yay) / 100) * genislik * 0.45; // kavisin derinliği
  const kenar = punto * 1.2;
  const yukseklik = sehim + kenar * 2;
  // Kavisli yol: uçlar aynı hizada, orta nokta yukarıda (∩) ya da aşağıda (∪)
  const uc = yay > 0 ? kenar + sehim : kenar;
  const kontrol = yay > 0 ? kenar + sehim - 2 * sehim : kenar + 2 * sehim;
  const id = `yay-${Math.abs(yay)}-${yay > 0 ? "u" : "a"}-${tekSatir.length}`;
  return (
    <svg
      data-reklam-yazi=""
      viewBox={`0 0 ${genislik} ${yukseklik}`}
      width={genislik}
      style={{ maxWidth: "100%", height: "auto", overflow: "visible", display: "block" }}
      aria-label={tekSatir}
    >
      <defs>
        <path id={id} d={`M 0 ${uc} Q ${genislik / 2} ${kontrol} ${genislik} ${uc}`} />
      </defs>
      <text
        fill={renk}
        fontSize={punto}
        fontWeight={700}
        style={{ paintOrder: "stroke" }}
        stroke={acik ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.85)"}
        strokeWidth={punto * 0.22}
        strokeLinejoin="round"
      >
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle" dominantBaseline="middle">
          {tekSatir}
        </textPath>
      </text>
    </svg>
  );
}

export default function ReklamGorseli({
  reklam,
  imgClassName = "w-full h-auto",
  className = "",
  suruklenebilir = false,
}: {
  reklam: { id?: number | null; gorsel_url: string; baslik?: string | null } & ReklamYazisi;
  imgClassName?: string;
  className?: string;
  // Yönetici önizlemesi: yazı bandı tutulup sürüklenebilir görünür (sürükleme işini önizleme yapar)
  suruklenebilir?: boolean;
}) {
  // Ziyaretçi izleme: reklamın ekranda kaldığı süre (yönetim panelindeki önizlemede sayılmaz)
  const resimRef = useRef<HTMLImageElement>(null);
  useReklamGorunme(resimRef, reklam.id);
  const yazi = (reklam.yazi || "").trim();
  const konum = (reklam.yazi_konum as YaziKonumu) || "alt";
  const renk = (reklam.yazi_renk as YaziRengi) || "beyaz";
  const boyut = BOYUT[(reklam.yazi_boyut as YaziBoyutu) || "orta"] || BOYUT.orta;
  const yon = (reklam.yazi_yon as YaziYonu) || "yatay";
  const yayVar = !(konum === "ust_serit" || konum === "alt_serit") && Number(reklam.yazi_yay || 0) !== 0;
  const dikey = yon !== "yatay" && !yayVar;
  const acik = ACIK_RENK.includes(renk);
  const serit = konum === "ust_serit" || konum === "alt_serit";
  const aci = serit ? 0 : sinirla(reklam.yazi_aci, 0, -180, 180);
  const yay = serit ? 0 : sinirla(reklam.yazi_yay, 0, -100, 100);

  const duzYazi = yazi ? (
    <div
      data-reklam-yazi=""
      className={`${boyut} font-bold leading-snug text-center whitespace-pre-line ${dikey ? "px-1.5 py-3" : "px-3 py-1.5"} ${
        serit ? "" : "rounded"
      } ${suruklenebilir ? "cursor-move select-none ring-2 ring-dashed ring-[#e8a020]" : ""}`}
      style={{
        color: RENK[renk] || RENK.beyaz,
        background: serit
          ? acik ? "#1a3a6b" : "#fff8eb"
          : acik ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.75)",
        textShadow: !serit && acik ? "0 1px 3px rgba(0,0,0,0.6)" : undefined,
        // Dikey yazı: yukarıdan aşağı = sağa yatık; aşağıdan yukarı = aynı yazı 180° döndürülmüş
        writingMode: dikey ? "vertical-rl" : undefined,
        // (yay verildiğinde dikey yön kullanılmaz; yay yazısı açı ile döndürülür)
        transform: yon === "asagidan_yukari" ? "rotate(180deg)" : undefined,
        maxHeight: dikey && !serit ? "100%" : undefined,
      }}
    >
      {yazi}
    </div>
  ) : null;

  // Yay verilmişse yazı kavisli çizilir (zemin kutusu yerine harf kenarlığı ile okunaklı olur); açı tümünü döndürür
  const icerik = yazi && yay !== 0 ? (
    <div className={suruklenebilir ? "cursor-move select-none outline-2 outline-dashed outline-[#e8a020] rounded" : ""}>
      <YayliYazi metin={yazi} yay={yay} punto={YAY_PUNTO[(reklam.yazi_boyut as YaziBoyutu) || "orta"] || 16} renk={RENK[renk] || RENK.beyaz} acik={acik} />
    </div>
  ) : duzYazi;
  const yaziKutusu = icerik ? (aci ? <div style={{ transform: `rotate(${aci}deg)` }}>{icerik}</div> : icerik) : null;

  const gorsel = (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={resimRef} src={reklam.gorsel_url} alt={reklam.baslik || "Reklam"} className={`block ${imgClassName}`} loading="lazy" draggable={false} data-reklam-resmi="" data-reklam-id={reklam.id ?? undefined} />
  );

  if (!yaziKutusu) return <div className={className}>{gorsel}</div>;

  if (serit) {
    // Yatay yazıda şerit resmin üstünde/altında; dikey yazıda solunda/sağında
    const once = konum === "ust_serit";
    return (
      <div className={`overflow-hidden ${dikey ? "flex items-stretch" : ""} ${className}`}>
        {once && <div className={dikey ? "flex" : ""}>{yaziKutusu}</div>}
        <div className={dikey ? "flex-1 min-w-0" : ""}>{gorsel}</div>
        {!once && <div className={dikey ? "flex" : ""}>{yaziKutusu}</div>}
      </div>
    );
  }

  if (konum === "serbest") {
    // Yazı bandının ortası resmin (yazi_x %, yazi_y %) noktasında durur
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {gorsel}
        <div
          className={`absolute ${suruklenebilir ? "" : "pointer-events-none"}`}
          style={{
            left: `${sinirla(reklam.yazi_x)}%`,
            top: `${sinirla(reklam.yazi_y)}%`,
            transform: "translate(-50%, -50%)",
            maxWidth: dikey ? undefined : "95%",
            maxHeight: dikey ? "95%" : undefined,
            width: dikey ? undefined : "max-content",
          }}
        >
          {yaziKutusu}
        </div>
      </div>
    );
  }

  const yer = konum === "ust" ? "top-2 items-start" : konum === "orta" ? "inset-y-0 items-center" : "bottom-2 items-end";
  return (
    <div className={`relative ${className}`}>
      {gorsel}
      <div className={`absolute flex justify-center pointer-events-none ${dikey ? "inset-y-2 left-2 right-2" : `left-2 right-2 ${yer}`}`}>
        {dikey ? (
          <div className={`flex h-full ${konum === "ust" ? "items-start" : konum === "orta" ? "items-center" : "items-end"}`}>{yaziKutusu}</div>
        ) : (
          yaziKutusu
        )}
      </div>
    </div>
  );
}
