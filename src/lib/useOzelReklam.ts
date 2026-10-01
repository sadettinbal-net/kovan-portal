import { useEffect, useState } from "react";

export type SlotReklam = {
  id: number;
  baslik: string;
  gorsel_url: string;
  link_url: string;
};

// Bir reklam alanı (konum) için aktif özel reklamı getirir.
// Birden fazla aktif reklam varsa her yüklemede rastgele biri seçilir (rotation).
export function useOzelReklam(konum: "video" | "sidebar" | "popup" | "anasayfa_ust", kategori?: string) {
  const [reklam, setReklam] = useState<SlotReklam | null>(null);
  const [yuklendi, setYuklendi] = useState(false);

  useEffect(() => {
    let iptal = false;
    const qs = new URLSearchParams({ konum });
    if (kategori) qs.set("kategori", kategori);
    fetch(`/api/reklam?${qs.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (iptal) return;
        const liste: SlotReklam[] = d.reklamlar || [];
        if (liste.length > 0) {
          setReklam(liste[Math.floor(Math.random() * liste.length)]);
        }
        setYuklendi(true);
      })
      .catch(() => {
        if (!iptal) setYuklendi(true);
      });
    return () => {
      iptal = true;
    };
  }, [konum, kategori]);

  return { reklam, yuklendi };
}

// Tıklanma sayacını artırır (sayfa geçişini engellemez)
export function reklamTikla(id: number) {
  try {
    fetch("/api/reklam/tiklama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      keepalive: true,
    });
  } catch {
    // sessizce yut
  }
}
