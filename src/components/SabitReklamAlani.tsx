"use client";

import { useEffect, useRef, useState } from "react";

// Reklam panellerini kaydırırken üst menünün (72px) hemen altında sabit tutar (sağ/sol menüler, detay sayfası).
// Paneller ekrana sığmazsa içlerindeki reklam resimleri sığacak kadar küçültülür
// (--reklam-img-max değişkeni; resim kırpılmaz, oranı korunur). Böylece hiçbir reklam ekranın dışında kalmaz.
const UST_BOSLUK = 88; // sabit üst menü 72px + 16px boşluk
const ALT_BOSLUK = 16;
const EN_KUCUK_RESIM = 90; // resimler bundan daha fazla küçültülmez

export default function SabitReklamAlani({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ust, setUst] = useState(UST_BOSLUK);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hesapla = () => {
      const alan = window.innerHeight - UST_BOSLUK - ALT_BOSLUK;
      const resimler = Array.from(el.querySelectorAll<HTMLImageElement>("img[data-reklam-resmi]"));
      // Telefonda (md altı) paneller sabit değil, alt alta akar; küçültmeye gerek yok
      if (resimler.length && window.innerWidth >= 768) {
        // Resim dışındaki her şey (başlıklar, boşluklar, yer tutucular) sabit; kalan yer resimlere eşit paylaştırılır
        const resimToplami = resimler.reduce((t, r) => t + r.getBoundingClientRect().height, 0);
        const digerleri = el.offsetHeight - resimToplami;
        const resimBasi = Math.max(EN_KUCUK_RESIM, Math.floor((alan - digerleri) / resimler.length));
        el.style.setProperty("--reklam-img-max", `${resimBasi}px`);
      } else {
        el.style.removeProperty("--reklam-img-max");
      }
      // Yine de sığmıyorsa (çok kısa ekran) son reklam görünene kadar kayar, sonra sabit kalır
      setUst(Math.min(UST_BOSLUK, window.innerHeight - el.offsetHeight - ALT_BOSLUK));
    };
    hesapla();
    const gozlemci = new ResizeObserver(hesapla);
    gozlemci.observe(el);
    // Resimler yüklendikçe yeniden hesapla
    el.addEventListener("load", hesapla, true);
    window.addEventListener("resize", hesapla);
    return () => {
      gozlemci.disconnect();
      el.removeEventListener("load", hesapla, true);
      window.removeEventListener("resize", hesapla);
    };
  }, []);

  return (
    <div ref={ref} className={`md:sticky space-y-3 ${className}`} style={{ top: ust }}>
      {children}
    </div>
  );
}
