"use client";

import { useEffect, useRef } from "react";
import { useOzelReklam, reklamTikla } from "@/lib/useOzelReklam";

// ─── ADSENSE BİLGİLERİ (içerik içi / in-article) ───────────────────────────
const ADSENSE_CLIENT = "ca-pub-8884760724680185"; // ← Yayıncı ID'niz
const ADSENSE_SLOT   = "8100037780";              // ← Reklam birimi slot ID'si
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window { adsbygoogle: unknown[] }
}

export default function VideoReklam({
  konum = "video",
  kategori,
}: {
  konum?: "video" | "popup";
  kategori?: string;
} = {}) {
  // Yöneticinin tanımladığı özel reklam (varsa Google yerine bu gösterilir)
  const { reklam, yuklendi } = useOzelReklam(konum, kategori);
  const pushed = useRef(false);

  useEffect(() => {
    // Sadece özel reklam YOKKEN ve veri yüklendiğinde Google reklamını tetikle
    if (!yuklendi || reklam) return;
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense scripti henüz yüklenmedi
    }
  }, [yuklendi, reklam]);

  // Veri gelene kadar boş (yanıp sönmeyi önler)
  if (!yuklendi) return null;

  // ─── Yöneticinin özel reklamı ───────────────────────────────────────────
  if (reklam) {
    const gorsel = (
      <img
        src={reklam.gorsel_url}
        alt={reklam.baslik || "Reklam"}
        className="w-full h-auto rounded-lg"
        loading="lazy"
      />
    );
    return (
      <div className="my-6">
        <p className="text-[10px] text-gray-400 text-center mb-1 tracking-wide uppercase">Reklam</p>
        {reklam.link_url ? (
          <a
            href={reklam.link_url}
            target="_blank"
            rel="noopener sponsored"
            onClick={() => reklamTikla(reklam.id)}
          >
            {gorsel}
          </a>
        ) : (
          gorsel
        )}
      </div>
    );
  }

  // ─── Google AdSense (içerik içi) ────────────────────────────────────────
  const isPlaceholder =
    ADSENSE_CLIENT.includes("XXXX") || ADSENSE_SLOT.includes("XXXX");

  if (isPlaceholder) {
    return (
      <div className="my-6 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 flex flex-col items-center justify-center py-8 gap-2">
        <span className="text-2xl">🎬</span>
        <p className="text-blue-700 font-semibold text-sm">Video Reklam Alanı</p>
        <p className="text-blue-500 text-xs text-center px-4">
          Google AdSense hesabı onaylandıktan sonra burada video reklam görünecek
        </p>
      </div>
    );
  }

  return (
    <div className="my-6">
      <p className="text-[10px] text-gray-400 text-center mb-1 tracking-wide uppercase">Reklam</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
      />
    </div>
  );
}
