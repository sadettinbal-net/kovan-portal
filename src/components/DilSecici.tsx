"use client";

import { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const LANGS = [
  { code: "tr" as const, flag: "https://flagcdn.com/20x15/tr.png", label: "Türkçe" },
  { code: "en" as const, flag: "https://flagcdn.com/20x15/gb.png", label: "English" },
  { code: "de" as const, flag: "https://flagcdn.com/20x15/de.png", label: "Deutsch" },
  { code: "fr" as const, flag: "https://flagcdn.com/20x15/fr.png", label: "Français" },
  { code: "ar" as const, flag: "https://flagcdn.com/20x15/sa.png", label: "العربية" },
  { code: "ru" as const, flag: "https://flagcdn.com/20x15/ru.png", label: "Русский" },
  { code: "es" as const, flag: "https://flagcdn.com/20x15/es.png", label: "Español" },
];

export default function DilSecici() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-[#0f2548] hover:bg-[#162e5e] text-gray-200 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
      >
        <img
          src={active.flag}
          alt={active.label}
          width={20}
          height={15}
          className="rounded-sm"
        />
        <span>{active.code.toUpperCase()}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute right-0 top-full mt-1 bg-[#0f2548] border border-[#2554a0] rounded-md shadow-lg overflow-hidden z-[9999] min-w-[120px]">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  lang === l.code
                    ? "bg-[#e8a020] text-white"
                    : "text-gray-200 hover:bg-[#1a3a6b]"
                }`}
              >
                <img
                  src={l.flag}
                  alt={l.label}
                  width={20}
                  height={15}
                  className="rounded-sm"
                />
                <span>{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
