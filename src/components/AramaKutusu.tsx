"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { supabase } from "@/lib/supabase";
import { aramaKosulu } from "@/lib/aramaDeseni";
import { useLanguage } from "@/contexts/LanguageContext";

const MAX_SUGGESTIONS = 8;

type FirmaOneri = { id: number; ad: string; sanayi_sitesi: string; sektor: string };

export default function AramaKutusu({ count }: { count?: number | null }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FirmaOneri[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { listening, supported, start, stop } = useSpeechToText((text) => {
    setQuery(text);
    if (text.trim()) {
      router.push(`/firmalar?ara=${encodeURIComponent(text.trim())}`);
    }
  });

  // Debounce ile anlık arama
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("firmalar")
        .select("id, ad, sanayi_sitesi, sektor")
        .or(aramaKosulu(q, ["ad", "sektor", "sanayi_sitesi"]))
        .not("ad", "ilike", "(Firma%")
        .limit(MAX_SUGGESTIONS);
      const results = data || [];
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIdx(-1);
    }, 250);
  }, [query]);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    if (query.trim()) {
      router.push(`/firmalar?ara=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      router.push(`/firma/${suggestions[activeIdx].id}`);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="bg-[#1a3a6b] py-3 phone:py-4 px-3 phone:px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-white text-base phone:text-xl font-bold mb-0.5 phone:mb-1">
          {t.searchTitle}
        </h2>
        <p className="text-gray-300 text-xs phone:text-sm mb-3 phone:mb-4">
          {count ? t.searchSubtitle(count) : t.searchSubtitleEmpty}
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative" ref={wrapperRef}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setOpen(true)}
              placeholder={listening ? t.searchListening : t.searchPlaceholder}
              autoComplete="off"
              className={`w-full px-3 phone:px-4 py-2.5 phone:py-3 pr-10 phone:pr-12 rounded-lg text-sm outline-none border-2 transition-colors ${
                listening ? "border-red-400 bg-red-50" : "border-transparent focus:border-[#e8a020]"
              }`}
            />

            {/* Mikrofon */}
            {supported !== false && (
              <button
                type="button"
                onClick={listening ? stop : start}
                title={listening ? t.voiceStop : t.voiceSearch}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-gray-400 hover:bg-gray-100 hover:text-[#1a3a6b]"
                }`}
              >
                <MicIcon />
              </button>
            )}

            {/* Öneri dropdown */}
            {open && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 text-left overflow-hidden">
                {suggestions.map((firma, i) => (
                  <li key={firma.id}>
                    <Link
                      href={`/firma/${firma.id}`}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        i === activeIdx ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-7 h-7 rounded bg-[#1a3a6b] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                        {firma.ad.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate">{firma.ad}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {firma.sanayi_sitesi}{firma.sektor ? ` · ${firma.sektor}` : ""}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
                {/* Tüm sonuçları gör */}
                <li className="border-t border-gray-100">
                  <button
                    type="submit"
                    className="w-full text-center px-4 py-2.5 text-xs text-[#1a3a6b] font-semibold hover:bg-blue-50 transition-colors"
                  >
                    {t.seeAllResults(query)}
                  </button>
                </li>
              </ul>
            )}
          </div>

          <button
            type="submit"
            className="bg-[#e8a020] hover:bg-[#c8851a] text-white px-3 phone:px-6 py-2.5 phone:py-3 rounded-lg font-semibold text-sm transition-colors flex-shrink-0"
          >
            {t.searchBtn}
          </button>
        </form>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
      <path d="M6.25 10a.75.75 0 0 1 .75.75 5 5 0 0 0 10 0 .75.75 0 0 1 1.5 0 6.5 6.5 0 0 1-5.75 6.45V19.5h2.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h2.5v-2.305A6.5 6.5 0 0 1 5.5 10.75.75.75 0 0 1 6.25 10z" />
    </svg>
  );
}
