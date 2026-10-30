"use client";

import { useEffect, useState } from "react";
import YanReklam from "@/components/YanReklam";
import type { SlotReklam } from "@/lib/useOzelReklam";

export type YanReklamKonumu = "anasayfa_sol" | "anasayfa_sag" | "detay_sol" | "detay_sag" | "site_sol" | "site_sag" | "tip_sol" | "tip_sag";

type PanelliReklam = SlotReklam & { panel?: number | null };

const rastgele = <T,>(liste: T[]) => liste[Math.floor(Math.random() * liste.length)];

// Reklamları panellere dağıtır:
//  - Reklam Yönetimi'nde "üstteki panel" (1) / "alttaki panel" (2) seçilen reklam o panelde çıkar
//    (aynı panele birden çok reklam varsa her açılışta biri seçilir)
//  - "Fark etmez" (0) seçilenler boş kalan panellere karışık dağıtılır
//  - Reklamı olmayan panelde Google reklamı, o da yoksa "Reklam Ver" görünür (YanReklam)
function dagit(reklamlar: PanelliReklam[], adet: number): (SlotReklam | null)[] {
  const serbest = [...reklamlar.filter((r) => !r.panel || r.panel > adet)].sort(() => Math.random() - 0.5);
  return Array.from({ length: adet }, (_, i) => {
    const buPanele = reklamlar.filter((r) => r.panel === i + 1);
    if (buPanele.length) return rastgele(buPanele);
    return serbest.shift() ?? null;
  });
}

export default function ReklamPanelleri({ konum, adet, kategori }: { konum: YanReklamKonumu; adet: number; kategori?: string }) {
  const [paneller, setPaneller] = useState<(SlotReklam | null)[] | null>(null);

  useEffect(() => {
    let iptal = false;
    const qs = new URLSearchParams({ konum });
    if (kategori) qs.set("kategori", kategori);
    fetch(`/api/reklam?${qs.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!iptal) setPaneller(dagit(d.reklamlar || [], adet));
      })
      .catch(() => {
        if (!iptal) setPaneller(Array.from({ length: adet }, () => null));
      });
    return () => {
      iptal = true;
    };
  }, [konum, kategori, adet]);

  return (
    <>
      {Array.from({ length: adet }, (_, i) => (
        <YanReklam key={i} reklam={paneller?.[i] ?? null} bekleniyor={paneller === null} />
      ))}
    </>
  );
}
