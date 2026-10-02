'use client';

import { useCallback, useEffect, useState } from 'react';
import { SIKAYET_SEBEP_ADLARI, type SikayetSebebi } from '@/lib/yorumlar';

// Yönetici paneli: "🔔 Yeni Yorumlar" ve "🚩 Şikâyetler" sekmeleri.

function Yildiz({ puan }: { puan: number }) {
  return <span className="text-yellow-400 text-xs">{'⭐'.repeat(puan)}<span className="text-gray-300">{'☆'.repeat(5 - puan)}</span></span>;
}

const tarih = (d: string) => new Date(d).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

type YeniYorum = {
  id: number; firma_id: number; firma_ad: string; kullanici_ad: string; kullanici_email: string;
  yorum: string; puan: number; created_at: string; gizli: boolean;
};

export function AdminYeniYorumlar({ onSayi }: { onSayi: (n: number) => void }) {
  const [yorumlar, setYorumlar] = useState<YeniYorum[]>([]);
  const [sayi, setSayi] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // İlk yüklemede "Yükleniyor" başlangıç durumundan gelir; sonraki yenilemelerde liste yerinde kalır
  const yukle = useCallback(async () => {
    const res = await fetch('/api/bildirimler?kapsam=yonetici');
    const data = await res.json();
    if (res.ok) {
      setYorumlar(data.yorumlar);
      setSayi(data.sayi);
      onSayi(data.sayi);
    } else {
      setHata(data.error || 'Yüklenemedi.');
    }
    setYukleniyor(false);
  }, [onSayi]);

  useEffect(() => { yukle(); }, [yukle]);

  async function gordum() {
    const res = await fetch('/api/bildirimler', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kapsam: 'yonetici' }),
    });
    if (res.ok) yukle();
    else setHata((await res.json()).error || 'İşlem başarısız.');
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-[#1a3a6b]">🔔 Yeni Yorumlar</h2>
          <p className="text-xs text-gray-500">Son baktığınızdan beri gelen yorumlar. “Tümünü gördüm” deyince sayaç sıfırlanır.</p>
        </div>
        {sayi > 0 && (
          <button onClick={gordum} className="px-3 py-1.5 bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-xs font-semibold rounded-lg">
            ✓ Tümünü gördüm
          </button>
        )}
      </div>
      {hata && <p className="px-4 py-2 text-sm text-red-700 bg-red-50">{hata}</p>}
      {yukleniyor ? (
        <p className="p-6 text-center text-sm text-gray-400">Yükleniyor...</p>
      ) : yorumlar.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400">Yeni yorum yok.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {sayi > yorumlar.length && (
            <p className="px-4 py-2 text-xs text-gray-500 bg-gray-50">Toplam {sayi} yeni yorum var; en yeni {yorumlar.length} tanesi gösteriliyor.</p>
          )}
          {yorumlar.map(y => (
            <div key={y.id} className="px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <a href={`/firma/${y.firma_id}`} target="_blank" className="font-semibold text-[#1a3a6b] hover:underline">{y.firma_ad}</a>
                <Yildiz puan={y.puan} />
                <span className="text-gray-700">{y.kullanici_ad}</span>
                <span className="text-gray-400 break-all">{y.kullanici_email}</span>
                <span className="text-gray-400">{tarih(y.created_at)}</span>
                {y.gizli && <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-semibold">Gizli</span>}
              </div>
              {y.yorum && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{y.yorum}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type SikayetliYorum = {
  id: number; firma_id: number; firma_ad: string; kullanici_ad: string; kullanici_email: string;
  yorum: string; puan: number; created_at: string; gizli: boolean;
  sikayetler: { id: number; sikayet_eden_email: string; sebep: SikayetSebebi; aciklama: string | null; created_at: string }[];
};

export function AdminSikayetler({ onSayi }: { onSayi: (n: number) => void }) {
  const [yorumlar, setYorumlar] = useState<SikayetliYorum[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemId, setIslemId] = useState<number | null>(null);
  const [mesaj, setMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null);

  // İlk yüklemede "Yükleniyor" başlangıç durumundan gelir; sonraki yenilemelerde liste yerinde kalır
  const yukle = useCallback(async () => {
    const res = await fetch('/api/admin/sikayetler');
    const data = await res.json();
    if (res.ok) {
      setYorumlar(data.yorumlar);
      onSayi(data.yorumlar.reduce((t: number, y: SikayetliYorum) => t + y.sikayetler.length, 0));
    } else {
      setMesaj({ tip: 'hata', metin: data.error || 'Yüklenemedi.' });
    }
    setYukleniyor(false);
  }, [onSayi]);

  useEffect(() => { yukle(); }, [yukle]);

  async function karar(yorumId: number, islem: 'gizle' | 'reddet') {
    setIslemId(yorumId);
    setMesaj(null);
    const res = await fetch('/api/admin/sikayetler', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ yorum_id: yorumId, islem }),
    });
    const data = await res.json();
    if (res.ok) {
      setMesaj({ tip: 'basari', metin: islem === 'gizle'
        ? 'Yorum gizlendi; sitede görünmüyor ve puana katılmıyor. Şikâyetler kapatıldı.'
        : 'Şikâyet reddedildi; yorum sitede kalıyor.' });
      yukle();
    } else {
      setMesaj({ tip: 'hata', metin: data.error || 'İşlem başarısız.' });
    }
    setIslemId(null);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b">
        <h2 className="font-bold text-[#1a3a6b]">🚩 Şikâyet Edilen Yorumlar</h2>
        <p className="text-xs text-gray-500">Bekleyen şikâyetler. “Yorumu gizle” yorumu sitede gizler ve puandan çıkarır; “Şikâyeti reddet” yorumu yerinde bırakır.</p>
      </div>
      {mesaj && (
        <p className={`px-4 py-2 text-sm ${mesaj.tip === 'basari' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{mesaj.metin}</p>
      )}
      {yukleniyor ? (
        <p className="p-6 text-center text-sm text-gray-400">Yükleniyor...</p>
      ) : yorumlar.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400">Bekleyen şikâyet yok.</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {yorumlar.map(y => (
            <div key={y.id} className="px-4 py-4">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">{y.sikayetler.length} şikâyet</span>
                <a href={`/firma/${y.firma_id}`} target="_blank" className="font-semibold text-[#1a3a6b] hover:underline">{y.firma_ad}</a>
                <Yildiz puan={y.puan} />
                <span className="text-gray-700">{y.kullanici_ad}</span>
                <span className="text-gray-400 break-all">{y.kullanici_email}</span>
                {y.gizli && <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-semibold">Zaten gizli</span>}
              </div>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{y.yorum || <span className="text-gray-400 italic">(yazısız, sadece puan)</span>}</p>
              <ul className="mt-2 space-y-1">
                {y.sikayetler.map(s => (
                  <li key={s.id} className="text-xs text-gray-600 bg-red-50 rounded px-2 py-1">
                    <strong>{SIKAYET_SEBEP_ADLARI[s.sebep] ?? s.sebep}</strong>
                    <span className="text-gray-400"> · {s.sikayet_eden_email} · {tarih(s.created_at)}</span>
                    {s.aciklama && <span className="block text-gray-700 mt-0.5">“{s.aciklama}”</span>}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-3">
                <button onClick={() => karar(y.id, 'gizle')} disabled={islemId === y.id}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                  {islemId === y.id ? '...' : '🙈 Yorumu gizle'}
                </button>
                <button onClick={() => karar(y.id, 'reddet')} disabled={islemId === y.id}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg disabled:opacity-50">
                  {islemId === y.id ? '...' : '✕ Şikâyeti reddet'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
