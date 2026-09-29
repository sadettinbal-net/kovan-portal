'use client';

import { useState } from 'react';

const MAX_BOYUT = 5 * 1024 * 1024; // 5MB
const MAX_FOTOGRAF = 5;

export type EkBilgiler = {
  hizmetler: string;
  kart_resmi: string | null;
  fotograflar: string[];
};

// Admin firma formları: sunulan hizmetler, kart resmi ve detay fotoğrafları.
// Resimler seçilir seçilmez yüklenir; forma sadece adresleri döner.
export default function FirmaEkBilgiler({
  deger,
  onChange,
}: {
  deger: EkBilgiler;
  onChange: (deger: EkBilgiler) => void;
}) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  const yukle = async (dosya: File) => {
    if (!dosya.type.startsWith('image/')) throw new Error(`"${dosya.name}" bir resim dosyası değil`);
    if (dosya.size > MAX_BOYUT) throw new Error(`"${dosya.name}" 5MB'den büyük`);
    const form = new FormData();
    form.append('dosya', dosya);
    const response = await fetch('/api/admin/resim-yukle', { method: 'POST', body: form });
    const sonuc = await response.json();
    if (!response.ok) throw new Error(sonuc.error || 'Resim yüklenemedi');
    return sonuc.url as string;
  };

  const kartResmiSec = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0];
    e.target.value = '';
    if (!dosya) return;
    setHata('');
    setYukleniyor(true);
    try {
      onChange({ ...deger, kart_resmi: await yukle(dosya) });
    } catch (err: any) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  };

  const fotografEkle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosyalar = Array.from(e.target.files || []);
    e.target.value = '';
    if (dosyalar.length === 0) return;
    const yer = MAX_FOTOGRAF - deger.fotograflar.length;
    setHata(dosyalar.length > yer ? `En fazla ${MAX_FOTOGRAF} fotoğraf ekleyebilirsiniz` : '');
    setYukleniyor(true);
    const yeniler: string[] = [];
    for (const dosya of dosyalar.slice(0, yer)) {
      try {
        yeniler.push(await yukle(dosya));
      } catch (err: any) {
        setHata(err.message);
      }
    }
    onChange({ ...deger, fotograflar: [...deger.fotograflar, ...yeniler] });
    setYukleniyor(false);
  };

  return (
    <div className="space-y-6">
      {/* Hizmetler */}
      <div>
        <label htmlFor="hizmetler" className="block text-sm font-medium text-gray-700 mb-2">
          Sunduğunuz Hizmetler
        </label>
        <textarea
          id="hizmetler"
          rows={3}
          value={deger.hizmetler}
          onChange={(e) => onChange({ ...deger, hizmetler: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="Virgülle ayırarak yazın: Motor, Yağ değişimi, Fren..."
        />
      </div>

      {/* Kart Resmi */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-1">Kart Resmi</p>
        <p className="text-xs text-gray-500 mb-3">Firma listesindeki kartta görünür. 1 adet, max 5MB.</p>
        <div className="flex items-center gap-4">
          {deger.kart_resmi && (
            <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-gray-200">
              <img src={deger.kart_resmi} alt="Kart resmi" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange({ ...deger, kart_resmi: null })}
                aria-label="Kart resmini kaldır"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs"
              >
                ✕
              </button>
            </div>
          )}
          <label className="cursor-pointer inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition">
            {deger.kart_resmi ? 'Değiştir' : 'Kart resmi seç'}
            <input type="file" accept="image/*" onChange={kartResmiSec} disabled={yukleniyor} className="hidden" />
          </label>
        </div>
      </div>

      {/* Detay Fotoğrafları */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-1">Detay Fotoğrafları</p>
        <p className="text-xs text-gray-500 mb-3">
          Firma detay sayfasında görünür. En fazla {MAX_FOTOGRAF} adet, her biri max 5MB.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {deger.fotograflar.map((url, i) => (
            <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
              <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange({ ...deger, fotograflar: deger.fotograflar.filter((_, j) => j !== i) })}
                aria-label="Fotoğrafı kaldır"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          {deger.fotograflar.length < MAX_FOTOGRAF && (
            <label className="cursor-pointer w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center text-3xl text-gray-400 hover:text-blue-600 transition">
              +
              <input type="file" accept="image/*" multiple onChange={fotografEkle} disabled={yukleniyor} className="hidden" />
            </label>
          )}
          <span className="text-sm text-gray-500">
            {deger.fotograflar.length}/{MAX_FOTOGRAF}
          </span>
        </div>
      </div>

      {yukleniyor && <p className="text-sm text-blue-600">Resim yükleniyor...</p>}
      {hata && <p className="text-sm text-red-600">{hata}</p>}
    </div>
  );
}
