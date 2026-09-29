'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UyelikMenusu from '@/components/UyelikMenusu';

// Yeni tasarımın lacivert üst menüsü
export const MENU = [
  { ad: 'Anasayfa', href: '/yeni-tasarim' },
  { ad: 'Firmalar', href: '/firmalar' },
  { ad: 'Konuma Göre Ara', href: '/' },
  { ad: 'Firma Ekle', href: '/firma-ekle' },
  { ad: 'İletişim', href: '/iletisim' },
];

export default function UstMenu() {
  const [acik, setAcik] = useState(false);
  const yol = usePathname();

  return (
    <header className="bg-[#1a3a6b] sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/yeni-tasarim" className="flex items-center gap-2 bg-white rounded-md px-3 py-1.5 shrink-0">
          <span className="text-2xl">🐝</span>
          <span className="leading-none">
            <span className="block font-black text-[#1a3a6b] tracking-tight">KOVAN PORTAL</span>
            <span className="block text-[10px] font-bold text-[#c8851a]">SANAYİ REHBERİ</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {MENU.map((m) => (
            <Link
              key={m.ad}
              href={m.href}
              className={`px-3 py-2 text-[15px] font-semibold rounded-md transition ${
                yol === m.href ? 'text-white bg-white/10' : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
            >
              {m.ad}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-[#0f2548] text-white text-sm font-bold px-3 py-1.5 rounded-md">
            🇹🇷 TR
          </span>
          <UyelikMenusu koyu />
        </div>

        <button
          className="lg:hidden p-2 text-white hover:bg-white/10 rounded-md"
          onClick={() => setAcik(!acik)}
          aria-label="Menü"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {acik && (
        <div className="lg:hidden border-t border-white/10 px-4 py-3 space-y-1">
          {MENU.map((m) => (
            <Link
              key={m.ad}
              href={m.href}
              onClick={() => setAcik(false)}
              className="block px-3 py-2 font-semibold text-white/90 hover:bg-white/10 rounded-md"
            >
              {m.ad}
            </Link>
          ))}
          <div className="pt-2">
            <UyelikMenusu koyu />
          </div>
        </div>
      )}
    </header>
  );
}
