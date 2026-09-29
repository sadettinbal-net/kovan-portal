'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Props {
  fotograflar: string[];
  firmaAd: string;
}

export default function FotoGaleri({ fotograflar, firmaAd }: Props) {
  const [acik, setAcik] = useState(false);
  const [aktif, setAktif] = useState(0);

  const ac = (i: number) => { setAktif(i); setAcik(true); };
  const kapat = () => setAcik(false);
  const onceki = useCallback(() => setAktif(i => (i - 1 + fotograflar.length) % fotograflar.length), [fotograflar.length]);
  const sonraki = useCallback(() => setAktif(i => (i + 1) % fotograflar.length), [fotograflar.length]);

  useEffect(() => {
    if (!acik) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') kapat();
      if (e.key === 'ArrowLeft') onceki();
      if (e.key === 'ArrowRight') sonraki();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [acik, onceki, sonraki]);

  if (fotograflar.length === 0) return null;

  return (
    <>
      {/* Küçük resim grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {fotograflar.map((url, i) => (
          <button
            key={i}
            onClick={() => ac(i)}
            className="relative aspect-video rounded-lg overflow-hidden border border-[#dde3ec] hover:opacity-90 transition-opacity block w-full"
          >
            <Image
              src={url}
              alt={`${firmaAd} fotoğraf ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {acik && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={kapat}
        >
          {/* X kapat */}
          <button
            onClick={kapat}
            className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
            aria-label="Kapat"
          >
            ✕
          </button>

          {/* Sayaç */}
          {fotograflar.length > 1 && (
            <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {aktif + 1} / {fotograflar.length}
            </span>
          )}

          {/* Sol ok */}
          {fotograflar.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); onceki(); }}
              className="absolute left-3 text-white bg-black/50 hover:bg-black/80 rounded-full w-11 h-11 flex items-center justify-center text-2xl transition-colors"
              aria-label="Önceki"
            >
              ‹
            </button>
          )}

          {/* Büyük resim */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-[90vw] h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={fotograflar[aktif]}
              alt={`${firmaAd} fotoğraf ${aktif + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Sağ ok */}
          {fotograflar.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); sonraki(); }}
              className="absolute right-3 text-white bg-black/50 hover:bg-black/80 rounded-full w-11 h-11 flex items-center justify-center text-2xl transition-colors"
              aria-label="Sonraki"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
