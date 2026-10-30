'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { bekleyenSureler } from '@/lib/reklamIzleme';

// Ziyaretçi izleme (Yönetim Paneli → Ziyaretçiler):
//  - Her tarayıcı sekmesi bir oturum (sessionStorage'daki rastgele numara)
//  - Reklama tıklama ve reklamın ekranda görünme süresi (lib/reklamIzleme.ts)
//  - Gezilen sayfalar ve tıklanan bağlantı/düğmeler (yalnızca yazısı ve gittiği adres; form alanlarına yazılanlar ASLA alınmaz)
//  - Sayfa açıkken 15 sn'de bir "hâlâ burada" sinyali → sitede kalma süresi
// IP, ülke/şehir ve cihaz bilgisi sunucuda (api/izle) eklenir. Yönetim paneli sayfaları izlenmez.

type Olay = { tip: 'sayfa' | 'tiklama' | 'reklam_tik' | 'reklam_izle'; sayfa: string; hedef?: string; baglanti?: string; reklam_id?: number; sure_ms?: number };

const ANAHTAR = 'izleme_oturum';
const SINYAL_MS = 15000;

function oturumNo(): string | null {
  try {
    let id = sessionStorage.getItem(ANAHTAR);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(ANAHTAR, id);
    }
    return id;
  } catch {
    return null;
  }
}

function yaziKisalt(s: string, n = 80) {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

// Tıklanan öğenin okunabilir adı: bağlantı/düğme yazısı, yoksa açıklama ya da resim adı
function hedefAdi(el: HTMLElement): string {
  const yazi = el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || '';
  if (yazi.trim()) return yaziKisalt(yazi);
  const img = el.querySelector('img');
  if (img?.alt) return yaziKisalt(`[resim] ${img.alt}`);
  return el.tagName === 'A' ? '[bağlantı]' : '[düğme]';
}

export default function ZiyaretciIzleme() {
  const pathname = usePathname();
  const kuyruk = useRef<Olay[]>([]);
  const ilkGonderim = useRef(true);
  const adminde = pathname?.startsWith('/admin') ?? false;

  // Kuyruktaki olayları gönderir; "kapanirken" ise sendBeacon ile (sayfa kapanırken de ulaşır)
  const gonder = useRef((kapanirken = false) => {
    const oturum = oturumNo();
    if (!oturum) return;
    // Reklam görünme süreleri önce (sayfa değişiminden önceki sayfaya yazılsın), sonra sıradaki olaylar
    const olaylar = [...bekleyenSureler(), ...kuyruk.current.splice(0, 50)];
    const govde: Record<string, unknown> = { oturum, olaylar };
    if (ilkGonderim.current) {
      ilkGonderim.current = false;
      govde.bilgi = {
        referrer: document.referrer || null,
        ekran: `${window.screen.width}x${window.screen.height}`,
        genislik: window.innerWidth,
        dil: navigator.language,
      };
    }
    const json = JSON.stringify(govde);
    try {
      if (kapanirken && navigator.sendBeacon) {
        navigator.sendBeacon('/api/izle', new Blob([json], { type: 'application/json' }));
      } else {
        fetch('/api/izle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: true }).catch(() => {});
      }
    } catch {
      // izleme sitenin çalışmasını asla bozmamalı
    }
  });

  // Sayfa değişince kaydet (aynı adres art arda iki kez yazılmaz; geliştirme modunda effect iki kez çalışabiliyor)
  const sonSayfa = useRef<string | null>(null);
  useEffect(() => {
    if (!pathname || adminde) return;
    const adres = pathname + window.location.search;
    if (sonSayfa.current === adres) return;
    sonSayfa.current = adres;
    kuyruk.current.push({ tip: 'sayfa', sayfa: adres });
    gonder.current();
  }, [pathname, adminde]);

  // Tıklamalar, "hâlâ burada" sinyali ve sayfa kapanışı
  useEffect(() => {
    if (adminde) return;

    const tikla = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('a, button, [role="button"], summary, input[type="submit"], input[type="button"]');
      if (!el) return;
      const a = el.closest('a');
      // Reklama tıklandıysa hangi reklam olduğu (reklam resmi data-reklam-id taşır)
      const reklamResmi = el.closest<HTMLElement>('[data-reklam-id]') || el.querySelector<HTMLElement>('[data-reklam-id]');
      const reklamId = Number(reklamResmi?.dataset.reklamId) || undefined;
      let baglanti: string | undefined;
      if (a?.href) {
        try {
          const u = new URL(a.href);
          baglanti = u.origin === window.location.origin ? u.pathname + u.search : u.href;
        } catch {
          baglanti = a.href;
        }
      }
      kuyruk.current.push(
        reklamId
          ? { tip: 'reklam_tik', sayfa: window.location.pathname + window.location.search, reklam_id: reklamId, baglanti }
          : { tip: 'tiklama', sayfa: window.location.pathname + window.location.search, hedef: hedefAdi(el), baglanti }
      );
      // Reklam yeni sekmede açılır; tıklama hemen gönderilsin
      if (reklamId) gonder.current();
      if (kuyruk.current.length >= 10) gonder.current();
    };

    const sinyal = setInterval(() => {
      if (document.visibilityState === 'visible') gonder.current();
    }, SINYAL_MS);

    const gizlenince = () => {
      if (document.visibilityState === 'hidden') gonder.current(true);
    };
    const kapaninca = () => gonder.current(true);

    document.addEventListener('click', tikla, true);
    document.addEventListener('visibilitychange', gizlenince);
    window.addEventListener('pagehide', kapaninca);
    return () => {
      clearInterval(sinyal);
      document.removeEventListener('click', tikla, true);
      document.removeEventListener('visibilitychange', gizlenince);
      window.removeEventListener('pagehide', kapaninca);
    };
  }, [adminde]);

  return null;
}
