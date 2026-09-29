'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function cihazTipi(): string {
  const w = window.innerWidth;
  if (w < 768) return 'Mobil';
  if (w < 1024) return 'Tablet';
  if (w < 1440) return 'Laptop';
  return 'Masaüstü';
}

export default function ZiyaretTakip() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    // Aynı oturumda aynı sayfayı tekrar sayma
    const sayfaKey = `ziyaret_sayfa_${pathname}`;
    if (sessionStorage.getItem(sayfaKey)) return;
    sessionStorage.setItem(sayfaKey, '1');

    const firmaMatch = pathname.match(/^\/firma\/(\d+)/);
    const firma_id = firmaMatch ? parseInt(firmaMatch[1]) : null;
    const referrer = document.referrer || null;
    const cihaz = cihazTipi();

    // Yeni oturum ise siteye giriş olarak kaydet
    if (!sessionStorage.getItem('oturum_id')) {
      sessionStorage.setItem('oturum_id', crypto.randomUUID());
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ sayfa: '__giris__', firma_id: null, referrer, cihaz }),
      }).catch(() => {});
    }

    // Ziyaret edilen sayfayı kaydet
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ sayfa: pathname, firma_id, referrer, cihaz }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
