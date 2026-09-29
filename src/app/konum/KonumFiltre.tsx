'use client';

import { useRouter } from 'next/navigation';
import KonumSecici, { type Konum } from '@/components/KonumSecici';

// Konuma Göre Ara: seçim adres çubuğuna yazılır, sayfa sunucuda süzülür
export default function KonumFiltre({ deger }: { deger: Konum }) {
  const router = useRouter();

  const git = (k: Konum) => {
    const q = new URLSearchParams();
    if (k.il) q.set('il', k.il);
    if (k.ilce) q.set('ilce', k.ilce);
    if (k.mahalleId) q.set('mahalle', k.mahalleId);
    if (k.sokakId) q.set('sokak', k.sokakId);
    const s = q.toString();
    router.push(`/konum${s ? `?${s}` : ''}`, { scroll: false });
  };

  return <KonumSecici deger={deger} onChange={git} />;
}
