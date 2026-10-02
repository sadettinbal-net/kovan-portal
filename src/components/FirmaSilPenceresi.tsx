'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adEslesiyor } from '@/lib/firmaAdEslesme';

type Bilgi = { ad: string; yorum: number; ziyaret: number; fotograf: number };

// Kalıcı silme onay penceresi: bağlı kayıt sayılarını gösterir, firma adı aynen yazılmadan silmez.
// adres: GET ?id= ile bilgi, DELETE { id, ad } ile silme yapan route (admin veya firma sahibi).
export default function FirmaSilPenceresi({ firmaId, firmaAdi, adres, onSilindi, onKapat }: {
  firmaId: number;
  firmaAdi: string;
  adres: string;
  onSilindi: (fotografHatasi: boolean) => void;
  onKapat: () => void;
}) {
  const { t } = useLanguage();
  const [bilgi, setBilgi] = useState<Bilgi | null>(null);
  const [yazilan, setYazilan] = useState('');
  const [siliyor, setSiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${adres}?id=${firmaId}`)
      .then(async res => {
        const data = await res.json();
        if (res.ok) setBilgi(data);
        else setHata(data.error || 'Firma bilgisi alınamadı.');
      })
      .catch(() => setHata('Bağlantı hatası. Lütfen tekrar deneyin.'));
  }, [adres, firmaId]);

  const eslesiyor = adEslesiyor(yazilan, firmaAdi);

  async function sil() {
    if (!eslesiyor) return;
    setSiliyor(true);
    setHata(null);
    try {
      const res = await fetch(adres, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: firmaId, ad: yazilan }),
      });
      const data = await res.json();
      if (res.ok) onSilindi(!!data.fotografHatasi);
      else setHata(data.error || 'Silme başarısız.');
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.');
    }
    setSiliyor(false);
  }

  const say = (metin: string, n: number) => metin.replace('{n}', String(n));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !siliyor && onKapat()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="text-lg font-bold text-red-700 mb-1">⚠️ {t.deleteDialogTitle}</h2>
        <p className="font-semibold text-gray-800 mb-3 break-words">{firmaAdi}</p>
        <p className="text-sm text-gray-600 mb-4">{t.deleteDialogWarning}</p>

        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4 text-sm text-gray-700">
          {bilgi ? (
            <>
              <p className="font-semibold mb-1">{t.deleteDialogWillRemove}</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>{say(t.deleteDialogReviews, bilgi.yorum)}</li>
                <li>{say(t.deleteDialogPhotos, bilgi.fotograf)}</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">{say(t.deleteDialogVisits, bilgi.ziyaret)}</p>
            </>
          ) : !hata && <p className="text-gray-400">{t.loadingText}</p>}
        </div>

        <label className="block text-sm text-gray-700 mb-1">{t.deleteDialogTypeName}</label>
        <input value={yazilan} onChange={e => setYazilan(e.target.value)} placeholder={firmaAdi} autoFocus
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 mb-3" />

        {hata && <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-3">{hata}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onKapat} disabled={siliyor}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold disabled:opacity-50">
            {t.cancelText}
          </button>
          <button onClick={sil} disabled={!eslesiyor || !bilgi || siliyor}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
            {siliyor ? t.deletingText : t.deleteDialogConfirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
