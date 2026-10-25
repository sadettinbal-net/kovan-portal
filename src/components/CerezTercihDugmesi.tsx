"use client";

import { TERCIH_AC_OLAYI, useCerezOnay } from "@/lib/cerezOnay";

// Gizlilik sayfasında: mevcut çerez tercihini gösterir ve çerez bandını yeniden açar.
export default function CerezTercihDugmesi() {
  const onay = useCerezOnay();
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-gray-600">
        Şu anki tercihiniz:{" "}
        <strong>{onay === "kabul" ? "Reklam çerezlerine izin verildi" : onay === "red" ? "Yalnızca zorunlu çerezler" : "Henüz seçim yapılmadı"}</strong>
      </span>
      <button
        onClick={() => window.dispatchEvent(new Event(TERCIH_AC_OLAYI))}
        className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        Çerez tercihlerimi değiştir
      </button>
    </div>
  );
}
