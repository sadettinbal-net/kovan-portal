"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type KategoriSayisi = {
  kategori: string;
  sayi: number;
};

interface Props {
  kategoriler: KategoriSayisi[];
  toplamFirma: number;
}

export default function RightSidebar({ kategoriler, toplamFirma }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeKategori = searchParams.get("kategori") || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [aramaMetni, setAramaMetni] = useState("");
  const [aramaSonuclari, setAramaSonuclari] = useState<any[]>([]);
  const [aramaAcik, setAramaAcik] = useState(false);
  const aramaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(window.innerWidth >= 768);
  }, []);

  // Arama debounce
  useEffect(() => {
    if (aramaMetni.length < 2) {
      setAramaSonuclari([]);
      setAramaAcik(false);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/arama-sitesiz?q=${encodeURIComponent(aramaMetni)}`);
      const data = await res.json();
      setAramaSonuclari(data.sonuclar || []);
      setAramaAcik(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [aramaMetni]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (aramaRef.current && !aramaRef.current.contains(e.target as Node)) {
        setAramaAcik(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <aside className="w-full md:w-72 flex-shrink-0">
      <div className="bg-white rounded-lg border border-[#dde3ec] overflow-hidden">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-full bg-[#e8a020] text-white px-3 py-2 font-bold text-sm flex items-center justify-between lg:cursor-default"
        >
          Sanayi Sitesi Dışındaki Firmalar
          <svg className={`w-3 h-3 transition-transform duration-200 lg:hidden ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Arama Kutusu */}
        <div className={`${menuOpen ? "block" : "hidden"} lg:block p-2 border-b border-gray-100`} ref={aramaRef}>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">🔍</span>
            <input
              type="text"
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              onFocus={() => aramaSonuclari.length > 0 && setAramaAcik(true)}
              placeholder="Firma ara..."
              className="w-full border border-[#dde3ec] rounded pl-6 pr-2 py-1.5 text-xs bg-white outline-none focus:border-[#e8a020]"
            />
            {aramaAcik && aramaSonuclari.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] max-h-64 overflow-y-auto">
                {aramaSonuclari.map((sonuc, i) => (
                  <Link
                    key={i}
                    href={sonuc.url}
                    onClick={() => { setAramaAcik(false); setAramaMetni(""); }}
                    className="flex items-start gap-2 px-3 py-2 text-xs hover:bg-yellow-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <span className="w-5 h-5 rounded bg-[#e8a020] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {sonuc.baslik.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-800 truncate">{sonuc.baslik}</div>
                      {sonuc.altBaslik && <div className="text-[10px] text-gray-400 truncate">{sonuc.altBaslik}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <ul className={`${menuOpen ? "block" : "hidden"} lg:block max-h-[28rem] overflow-y-auto`}>
          <li>
            <Link
              href="/firmalar?sanayi_sitesi=yok"
              className={`flex justify-between items-center px-3 py-2 text-sm font-semibold border-b border-gray-100 hover:bg-yellow-50 transition-colors ${!activeKategori ? "bg-yellow-50 text-[#e8a020] font-semibold" : "text-gray-700"}`}
            >
              <span>Tümü</span>
              <span className="bg-[#e8a020] text-white text-[10px] px-1.5 py-0.5 rounded-full">{toplamFirma}</span>
            </Link>
          </li>

          {kategoriler.map((kat) => {
            const isActive = activeKategori === kat.kategori;
            return (
              <li key={kat.kategori}>
                <Link
                  href={`/firmalar?sanayi_sitesi=yok&kategori=${encodeURIComponent(kat.kategori)}`}
                  className={`flex justify-between items-center px-3 py-2 text-sm font-semibold border-b border-gray-100 hover:bg-yellow-50 transition-colors ${isActive ? "bg-yellow-50 text-[#e8a020] font-bold" : "text-gray-800"}`}
                >
                  <span className="leading-tight">{kat.kategori}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-1 flex-shrink-0 ${isActive ? "bg-[#e8a020] text-white" : "bg-gray-200 text-gray-700"}`}>
                    {kat.sayi}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
