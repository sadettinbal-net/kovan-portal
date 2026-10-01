"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useOzelReklam, reklamTikla } from "@/lib/useOzelReklam";

// Ana sayfa üst şerit reklam alanı (arama kutusunun altı, ilk ekranda).
// Sıra: 1) Reklam Yönetimi'nde bu alan için yayında olan kendi reklamımız
//       2) Google AdSense   3) AdSense dolmazsa / engellenirse "Reklam Ver" yer tutucusu
// Yükseklik sabit: sayfa yüklenirken içerik zıplamaz.

const ADSENSE_CLIENT = "ca-pub-8884760724680185";
// GEÇİCİ: sağ menüdeki AdSense birimi. Yayına girince bu alan için yeni birim numarası verilecek (NOTLAR.md).
const ADSENSE_SLOT = "7684004731";
const ADSENSE_BEKLEME_MS = 4000;

const KUTU = "relative w-full h-[100px] md:h-[120px] rounded-lg overflow-hidden";

function YerTutucu() {
  return (
    <Link
      href="/reklam-ver"
      className={`${KUTU} flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#e8a020]/60 bg-[#fff8eb] hover:bg-[#ffefcc] transition-colors text-center px-4`}
    >
      <span className="text-[#1a3a6b] font-bold text-base md:text-lg">Bu alanda reklamınız olabilir</span>
      <span className="text-[#e8a020] font-semibold text-sm">Reklam Ver →</span>
    </Link>
  );
}

function GoogleReklam() {
  const insRef = useRef<HTMLModElement>(null);
  const [doldu, setDoldu] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense betiği yüklenmedi (ör. reklam engelleyici); aşağıdaki süre dolunca yer tutucu görünür
    }
    const zamanlayici = setTimeout(() => {
      const ins = insRef.current;
      const durum = ins?.getAttribute("data-ad-status");
      setDoldu(durum === "filled" || (durum === null && !!ins?.querySelector("iframe")));
    }, ADSENSE_BEKLEME_MS);
    return () => clearTimeout(zamanlayici);
  }, []);

  if (doldu === false) return <YerTutucu />;

  return (
    <div className={`${KUTU} bg-gray-50`}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export default function AnasayfaBanner() {
  const { reklam, yuklendi } = useOzelReklam("anasayfa_ust");

  let icerik: React.ReactNode;
  if (!yuklendi) {
    icerik = <div className={`${KUTU} bg-gray-100 animate-pulse`} />;
  } else if (reklam) {
    const gorsel = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={reklam.gorsel_url} alt={reklam.baslik || "Reklam"} className="w-full h-full object-cover" />
    );
    icerik = (
      <div className={`${KUTU} bg-gray-100`}>
        {reklam.link_url ? (
          <a href={reklam.link_url} target="_blank" rel="noopener sponsored" onClick={() => reklamTikla(reklam.id)} className="block w-full h-full">
            {gorsel}
          </a>
        ) : (
          gorsel
        )}
        <span className="absolute top-1.5 left-1.5 bg-black/55 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
          Reklam
        </span>
      </div>
    );
  } else {
    icerik = <GoogleReklam />;
  }

  return (
    <div className="mb-4">
      {icerik}
      <div className="text-right mt-1">
        <Link href="/reklam-ver" className="text-[11px] text-gray-500 hover:text-[#1a3a6b] hover:underline">
          Bu alana reklam vermek için tıklayın
        </Link>
      </div>
    </div>
  );
}
