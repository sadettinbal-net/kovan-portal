/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useRef } from "react";

// Tarayıcının yanlış tanıdığı yaygın Türkçe kelimeler
const KELIME_DUZELTME: Record<string, string> = {
  sirket: "şirket", sirketi: "şirketi", sirketinin: "şirketinin",
  celik: "çelik", celigi: "çeliği", celikci: "çelikçi",
  insaat: "inşaat", insaati: "inşaatı", insaatci: "inşaatçı",
  uretim: "üretim", uretiм: "üretim", uretici: "üretici",
  ozel: "özel", ozeli: "özeli",
  gida: "gıda", gidaci: "gıdacı",
  makina: "makine", makinaci: "makineci",
  elektirik: "elektrik", elektrigi: "elektriği",
  kimyasal: "kimyasal",
  ambalaj: "ambalaj",
  umraniye: "ümraniye",
  dudullu: "dudullu",
  atasehir: "ataşehir",
  kadikoy: "kadıköy",
  uskudar: "üsküdar",
  arac: "araç", araci: "aracı",
  ic: "iç", ici: "içi",
  kaucuk: "kaucuk",
  donus: "dönüş", donusum: "dönüşüm",
  mobilya: "mobilya",
  canta: "çanta", cantaci: "çantacı",
  otomotiv: "otomotiv",
};

function duzeltTurkce(metin: string): string {
  return metin
    .split(" ")
    .map((kelime) => {
      const kucuk = kelime.toLowerCase();
      const duzeltme = KELIME_DUZELTME[kucuk];
      if (!duzeltme) return kelime;
      // Orijinal büyük/küçük harf kalıbını koru
      if (kelime[0] === kelime[0].toUpperCase()) {
        return duzeltme.charAt(0).toUpperCase() + duzeltme.slice(1);
      }
      return duzeltme;
    })
    .join(" ");
}

function turkceSayisi(s: string): number {
  return (s.match(/[şçğüöıİŞÇĞÜÖ]/g) || []).length;
}

export function useSpeechToText(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SR();
    recognition.lang = "tr-TR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e: any) => {
      // Tüm alternatifleri topla
      const alternatives: string[] = [];
      for (let i = 0; i < e.results[0].length; i++) {
        const t = e.results[0][i].transcript
          .replace(/[.,!?;:()\-]+$/g, "")
          .trim();
        if (t) alternatives.push(t);
      }

      // Türkçe karakter içereni tercih et, sonra kelime düzeltmesi uygula
      alternatives.sort((a, b) => turkceSayisi(b) - turkceSayisi(a));
      const best = duzeltTurkce(alternatives[0] || "");
      if (best) onResult(best);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}
