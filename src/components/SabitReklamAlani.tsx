"use client";

import { useEffect, useRef, useState } from "react";

// Reklam panellerini kaydırırken ekranda sabit tutar (sağ/sol menülerde).
// Paneller ekrana sığıyorsa üst menünün (72px) hemen altında durur.
// Ekrandan uzunsa önce son panel görünene kadar kayar, sonra olduğu yerde sabit kalır
// (böylece en alttaki reklam da hiç görünmeden kalmaz).
const UST_BOSLUK = 88; // sabit üst menü 72px + 16px boşluk
const ALT_BOSLUK = 16;

export default function SabitReklamAlani({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ust, setUst] = useState(UST_BOSLUK);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hesapla = () => setUst(Math.min(UST_BOSLUK, window.innerHeight - el.offsetHeight - ALT_BOSLUK));
    hesapla();
    const gozlemci = new ResizeObserver(hesapla);
    gozlemci.observe(el);
    window.addEventListener("resize", hesapla);
    return () => {
      gozlemci.disconnect();
      window.removeEventListener("resize", hesapla);
    };
  }, []);

  return (
    <div ref={ref} className={`md:sticky space-y-3 ${className}`} style={{ top: ust }}>
      {children}
    </div>
  );
}
