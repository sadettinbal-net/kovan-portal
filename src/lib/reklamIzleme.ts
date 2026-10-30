"use client";

import { useEffect, type RefObject } from "react";

// Reklamın ekranda görünme (izlenme) süresi — Yönetim Paneli → Ziyaretçiler'de "Reklamı gördü: … — 12 sn" olarak çıkar.
// Bir reklam, en az yarısı ekranda ve sekme açıkken "görünüyor" sayılır.
// Süreler burada birikir; ZiyaretciIzleme her gönderimde bekleyenSureler() ile yalnızca yeni biriken kısmı alır.

type Kayit = { reklamId: number; sayfa: string; toplamMs: number; gonderilenMs: number; acik: number; baslangic: number | null };

const kayitlar = new Map<string, Kayit>();

const yonetimde = () => typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
const simdikiSayfa = () => window.location.pathname + window.location.search;
const sekmeAcik = () => document.visibilityState === "visible";

function kayit(reklamId: number, sayfa: string) {
  const anahtar = `${reklamId}|${sayfa}`;
  let k = kayitlar.get(anahtar);
  if (!k) {
    k = { reklamId, sayfa, toplamMs: 0, gonderilenMs: 0, acik: 0, baslangic: null };
    kayitlar.set(anahtar, k);
  }
  return k;
}

function durdur(k: Kayit) {
  if (k.baslangic !== null) {
    k.toplamMs += Date.now() - k.baslangic;
    k.baslangic = null;
  }
}

// Sekme gizlenince bütün sayaçlar durur, geri gelince görünen reklamlarınki devam eder
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    for (const k of kayitlar.values()) {
      if (sekmeAcik()) {
        if (k.acik > 0 && k.baslangic === null) k.baslangic = Date.now();
      } else {
        durdur(k);
      }
    }
  });
}

function gorunurlukDegisti(reklamId: number, sayfa: string, gorunur: boolean) {
  const k = kayit(reklamId, sayfa);
  if (gorunur) {
    k.acik += 1;
    if (k.acik === 1 && sekmeAcik()) k.baslangic = Date.now();
  } else if (k.acik > 0) {
    k.acik -= 1;
    if (k.acik === 0) durdur(k);
  }
}

// Gönderilmemiş süreler (en az 1 sn biriktiyse). Çalışan sayaçlar da o ana kadarki süreyle sayılır.
export function bekleyenSureler(): { tip: "reklam_izle"; reklam_id: number; sayfa: string; sure_ms: number }[] {
  const sonuc: { tip: "reklam_izle"; reklam_id: number; sayfa: string; sure_ms: number }[] = [];
  const simdi = Date.now();
  for (const [anahtar, k] of kayitlar) {
    const toplam = k.toplamMs + (k.baslangic !== null ? simdi - k.baslangic : 0);
    const yeni = toplam - k.gonderilenMs;
    if (yeni >= 1000) {
      sonuc.push({ tip: "reklam_izle", reklam_id: k.reklamId, sayfa: k.sayfa, sure_ms: Math.round(yeni) });
      k.gonderilenMs = toplam;
    }
    if (k.acik === 0 && k.baslangic === null && k.gonderilenMs >= k.toplamMs) kayitlar.delete(anahtar);
  }
  return sonuc;
}

// Reklam bileşeninde: reklam resmi en az yarısı ekrandayken süre sayar
export function useReklamGorunme(ref: RefObject<Element | null>, reklamId: number | null | undefined) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !reklamId || yonetimde() || typeof IntersectionObserver === "undefined") return;
    const sayfa = simdikiSayfa();
    let gorunur = false;
    const gozlemci = new IntersectionObserver(
      ([g]) => {
        const simdi = g.isIntersecting && g.intersectionRatio >= 0.5;
        if (simdi !== gorunur) {
          gorunur = simdi;
          gorunurlukDegisti(reklamId, sayfa, simdi);
        }
      },
      { threshold: [0, 0.5, 1] }
    );
    gozlemci.observe(el);
    return () => {
      gozlemci.disconnect();
      if (gorunur) gorunurlukDegisti(reklamId, sayfa, false);
    };
  }, [ref, reklamId]);
}
