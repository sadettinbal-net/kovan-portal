"use client";

import { useState, useEffect } from "react";

type AdVariant = "leaderboard" | "rectangle" | "sidebar" | "infeed";

const variants: Record<AdVariant, { label: string; className: string; inner: string }> = {
  leaderboard: {
    label: "728×90",
    className: "w-full h-20 sm:h-24",
    inner: "flex-row gap-4",
  },
  rectangle: {
    label: "336×280",
    className: "w-full h-48",
    inner: "flex-col gap-2",
  },
  sidebar: {
    label: "300×250",
    className: "w-full h-52",
    inner: "flex-col gap-2",
  },
  infeed: {
    label: "Sponsorlu",
    className: "w-full h-full min-h-[220px]",
    inner: "flex-col gap-2",
  },
};

const placeholders = [
  {
    icon: "🔧",
    title: "OTO YEDEK PARÇA",
    desc: "Tüm marka ve modeller için orijinal yedek parça",
    cta: "Fiyat Al",
    color: "from-blue-600 to-blue-800",
  },
  {
    icon: "🎨",
    title: "BOYA & KAPLAMA",
    desc: "Profesyonel araç boyama ve seramik kaplama",
    cta: "Randevu Al",
    color: "from-orange-500 to-orange-700",
  },
  {
    icon: "🚗",
    title: "JANT & LASTİK",
    desc: "Her bütçeye uygun lastik ve jant seçenekleri",
    cta: "İncele",
    color: "from-green-600 to-green-800",
  },
  {
    icon: "⚡",
    title: "OTO ELEKTRİK",
    desc: "Araç elektrikleri ve elektronik arıza tespiti",
    cta: "Ulaş",
    color: "from-purple-600 to-purple-800",
  },
];

export default function AdBanner({ variant = "leaderboard" }: { variant?: AdVariant }) {
  const v = variants[variant];
  const [adIndex, setAdIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAdIndex(Math.floor(Math.random() * placeholders.length));
    setMounted(true);
  }, []);

  const ad = placeholders[adIndex];

  return (
    <div
      className={`relative ${v.className} rounded-lg overflow-hidden border border-dashed border-gray-300 bg-gradient-to-br ${mounted ? ad.color : "from-gray-400 to-gray-500"} group transition-colors`}
    >
      {/* Reklam etiketi */}
      <span className="absolute top-1.5 left-1.5 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded z-10 tracking-wide">
        Reklam
      </span>

      {/* Format etiketi (demo) */}
      <span className="absolute top-1.5 right-1.5 bg-black/30 text-white/70 text-[9px] px-1.5 py-0.5 rounded z-10">
        {v.label}
      </span>

      {mounted && (
        <div className={`absolute inset-0 flex items-center justify-center ${v.inner} px-6 pt-5`}>
          <span className="text-3xl">{ad.icon}</span>
          <div className="text-center text-white">
            <div className="font-bold text-sm leading-tight">{ad.title}</div>
            {variant !== "leaderboard" && (
              <div className="text-white/80 text-xs mt-1 leading-snug">{ad.desc}</div>
            )}
            {variant === "leaderboard" && (
              <div className="text-white/80 text-xs">{ad.desc}</div>
            )}
          </div>
          <button className="bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex-shrink-0">
            {ad.cta}
          </button>
        </div>
      )}
    </div>
  );
}
