"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const VideoReklam = dynamic(() => import("@/components/VideoReklam"), { ssr: false });

const GEC_SURESI = 5; // "Geç" butonu kaç saniye sonra çıksın

type Props = {
  onTamamlandi: () => void;
  kategori?: string;
};

export default function VideoReklamModal({ onTamamlandi, kategori }: Props) {
  const [sure] = useState(() => Math.floor(Math.random() * 11) + 15); // 15-25 sn
  const [kalan, setKalan] = useState(sure);

  const tamamla = useCallback(() => {
    onTamamlandi();
  }, [onTamamlandi]);

  useEffect(() => {
    if (kalan <= 0) {
      tamamla();
      return;
    }
    const timer = setTimeout(() => setKalan((k) => k - 1), 1000);
    return () => clearTimeout(timer);
  }, [kalan, tamamla]);

  const yuzde = Math.round(((sure - kalan) / sure) * 100);
  const gecBekliyor = sure - kalan < GEC_SURESI;
  const gecKalan = gecBekliyor ? GEC_SURESI - (sure - kalan) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Üst bar */}
        <div className="bg-[#1a3a6b] px-5 py-3 flex items-center justify-between">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Reklam</p>
          <span className="text-white text-sm">
            <span className="font-bold text-[#ffd166]">{kalan}</span> saniye
          </span>
        </div>

        {/* Video reklam alanı */}
        <div className="px-4 pt-2 pb-3">
          <VideoReklam konum="popup" kategori={kategori} />
        </div>

        {/* İlerleme çubuğu + Geç butonu */}
        <div className="px-4 pb-4 space-y-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e8a020] rounded-full transition-all duration-1000"
              style={{ width: `${yuzde}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Otomatik yönlendirme {kalan} saniye sonra
            </p>

            {gecBekliyor ? (
              /* Sayaç: "5 sn sonra geçebilirsiniz" */
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                {gecKalan} sn sonra geç
              </span>
            ) : (
              /* Aktif "Geç →" butonu */
              <button
                onClick={tamamla}
                className="text-xs font-bold text-white bg-[#1a3a6b] hover:bg-[#2554a0] px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                Geç →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
