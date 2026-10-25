"use client";

import { useSyncExternalStore } from "react";

// Çerez onayı: "kabul" = reklam (Google AdSense) çerezlerine izin var, "red" = yalnızca zorunlu çerezler.
// Tercih tarayıcının yerel depolamasında tutulur. Eski sürümdeki tek düğmeli bandın "1" değeri geçerli bir seçim
// sayılmaz; bu ziyaretçilere bant yeniden gösterilir.

export type CerezOnay = "kabul" | "red";

const ANAHTAR = "cerez-onay";
const OLAY = "cerez-onay-degisti";
export const TERCIH_AC_OLAYI = "cerez-tercih-ac";

export function cerezOnayiOku(): CerezOnay | null {
  try {
    const d = localStorage.getItem(ANAHTAR);
    return d === "kabul" || d === "red" ? d : null;
  } catch {
    return null;
  }
}

export function cerezOnayiYaz(d: CerezOnay) {
  try {
    localStorage.setItem(ANAHTAR, d);
  } catch {
    // depolama kapalıysa tercih yalnızca bu sayfa için geçerli olur
  }
  window.dispatchEvent(new CustomEvent(OLAY, { detail: d }));
}

// Bileşenlerde güncel onay durumunu izlemek için (sunucuda ve ilk çizimde null)
function abone(degisti: () => void) {
  window.addEventListener(OLAY, degisti);
  window.addEventListener("storage", degisti); // başka sekmede değişirse
  return () => {
    window.removeEventListener(OLAY, degisti);
    window.removeEventListener("storage", degisti);
  };
}

export function useCerezOnay(): CerezOnay | null {
  return useSyncExternalStore(abone, cerezOnayiOku, () => null);
}
