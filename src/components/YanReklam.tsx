"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { reklamTikla, type SlotReklam } from "@/lib/useOzelReklam";
import { useCerezOnay } from "@/lib/cerezOnay";
import ReklamGorseli from "@/components/ReklamGorseli";

// Sağ/sol menüdeki ve detay sayfasındaki reklam paneli. Sıra:
//   1) Reklam Yönetimi'nden bu panele konan kendi reklamımız
//   2) Google AdSense (yalnızca ziyaretçi çerez bandında "Kabul Et" dediyse)
//   3) Google reklam göndermezse / engellenirse "Reklam Ver" yer tutucusu
const ADSENSE_CLIENT = "ca-pub-8884760724680185";
// Paneller 160px yüksekliğinde: sol menüde alt alta 3 reklam ekrana sığsın diye.
// GEÇİCİ: sol menüdeki AdSense birimi. Yayına girince bu paneller için yeni birim numarası verilecek (NOTLAR.md).
const ADSENSE_SLOT = "7684004731";
const ADSENSE_BEKLEME_MS = 4000;

function YerTutucu() {
  return (
    <Link
      href="/reklam-ver"
      className="flex flex-col items-center justify-center gap-2 w-full h-[160px] rounded border-2 border-dashed border-[#e8a020]/60 bg-[#fff8eb] hover:bg-[#ffefcc] transition-colors text-center px-4"
    >
      <span className="text-3xl">📢</span>
      <span className="text-[#1a3a6b] font-bold text-base leading-snug">Bu alanda reklamınız olabilir</span>
      <span className="bg-[#e8a020] text-white text-sm font-semibold px-3 py-1.5 rounded-lg">Reklam Ver →</span>
    </Link>
  );
}

function GoogleReklam() {
  const insRef = useRef<HTMLModElement>(null);
  const [doldu, setDoldu] = useState<boolean | null>(null);

  useEffect(() => {
    const ins = insRef.current;
    // Bu alan zaten doldurulmuşsa tekrar isteme (geliştirme modunda effect iki kez çalışabiliyor)
    if (ins && !ins.getAttribute("data-adsbygoogle-status")) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // AdSense betiği yüklenmedi (ör. reklam engelleyici); süre dolunca yer tutucu görünür
      }
    }
    const durumuOku = () => {
      const durum = ins?.getAttribute("data-ad-status");
      if (durum === "filled") setDoldu(true);
      else if (durum === "unfilled") setDoldu(false);
    };
    const gozlemci = new MutationObserver(durumuOku);
    if (ins) gozlemci.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
    const zamanlayici = setTimeout(() => {
      const durum = ins?.getAttribute("data-ad-status");
      if (durum !== "filled" && !ins?.querySelector("iframe")) setDoldu(false);
      else durumuOku();
    }, ADSENSE_BEKLEME_MS);
    return () => {
      clearTimeout(zamanlayici);
      gozlemci.disconnect();
    };
  }, []);

  if (doldu === false) return <YerTutucu />;

  return (
    <div className="w-full min-h-[160px] rounded bg-gray-50">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: 160 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// reklam: bu panele düşen kendi reklamımız; bekleniyor: reklam bilgisi henüz gelmedi (boş kutu)
export default function YanReklam({ reklam, bekleniyor = false }: { reklam?: SlotReklam | null; bekleniyor?: boolean }) {
  const cerezOnay = useCerezOnay();

  let icerik: React.ReactNode;
  if (reklam) {
    icerik = reklam.link_url ? (
      <a href={reklam.link_url} target="_blank" rel="noopener sponsored" onClick={() => reklamTikla(reklam.id)}>
        <ReklamGorseli reklam={reklam} className="rounded overflow-hidden" />
      </a>
    ) : (
      <ReklamGorseli reklam={reklam} className="rounded overflow-hidden" />
    );
  } else if (bekleniyor) {
    icerik = <div className="w-full h-[160px] rounded bg-gray-50" />;
  } else if (cerezOnay === "kabul") {
    icerik = <GoogleReklam />;
  } else {
    icerik = <YerTutucu />;
  }

  return (
    <div className="bg-white rounded-lg border border-[#dde3ec] overflow-hidden">
      <div className="bg-gray-100 text-gray-500 px-3 py-1.5 font-semibold text-xs text-center border-b border-[#dde3ec]">
        Reklam
      </div>
      <div className="p-2">{icerik}</div>
    </div>
  );
}
