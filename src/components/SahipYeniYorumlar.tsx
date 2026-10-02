'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

type YeniYorum = { id: number; firma_id: number; firma_ad: string; kullanici_ad: string; yorum: string; puan: number; created_at: string };

// Profil sayfası: firma sahibinin kendi firmalarına gelen, henüz görmediği yorumlar.
// Firması olmayan üyede hiçbir şey göstermez.
export default function SahipYeniYorumlar() {
  const { t } = useLanguage();
  const [veri, setVeri] = useState<{ sayi: number; yorumlar: YeniYorum[]; sahipMi: boolean } | null>(null);

  const yukle = useCallback(async () => {
    const res = await fetch('/api/bildirimler?kapsam=sahip');
    if (res.ok) setVeri(await res.json());
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  async function gordum() {
    const res = await fetch('/api/bildirimler', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kapsam: 'sahip' }),
    });
    if (res.ok) {
      await yukle();
      window.dispatchEvent(new Event('yorum-bildirimi-goruldu'));
    }
  }

  if (!veri?.sahipMi) return null;

  return (
    <div className="mt-4 rounded-xl border border-[#d0daea] bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#e2eaf6]">
        <p className="text-sm font-semibold text-[#1a3a6b] flex items-center gap-2">
          🔔 {t.newReviewsTitle}
          {veri.sayi > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{veri.sayi}</span>}
        </p>
        {veri.sayi > 0 && (
          <button onClick={gordum} className="text-xs font-semibold text-[#1a3a6b] hover:underline">✓ {t.markSeenBtn}</button>
        )}
      </div>
      {veri.yorumlar.length === 0 ? (
        <p className="px-3 py-3 text-sm text-gray-400">{t.noNewReviews}</p>
      ) : (
        <ul className="divide-y divide-[#f0f3f8]">
          {veri.yorumlar.map(y => (
            <li key={y.id} className="px-3 py-2">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Link href={`/firma/${y.firma_id}`} className="font-semibold text-[#1a3a6b] hover:underline">{y.firma_ad}</Link>
                <span className="text-yellow-400">{'⭐'.repeat(y.puan)}</span>
                <span className="text-gray-600">{y.kullanici_ad}</span>
                <span className="text-gray-400">{new Date(y.created_at).toLocaleDateString(t.memberSinceDateLocale)}</span>
              </div>
              {y.yorum && <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{y.yorum}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
