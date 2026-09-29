'use client';

import { useEffect, useState } from 'react';

type Mesaj = {
  id: number;
  ad_soyad: string;
  telefon: string | null;
  eposta: string | null;
  mesaj: string;
  okundu: boolean;
  created_at: string;
};

// Yönetici Paneli: İletişim sayfasından gelen mesajlar
export default function IletisimMesajlari() {
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [sadeceOkunmamis, setSadeceOkunmamis] = useState(false);

  const yukle = async () => {
    setYukleniyor(true);
    try {
      const response = await fetch('/api/admin/iletisim-mesajlari');
      if (response.ok) setMesajlar(await response.json());
      else setHata('Mesajlar yüklenemedi');
    } catch {
      setHata('Bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    yukle();
  }, []);

  const okunduYap = async (mesaj: Mesaj, okundu: boolean) => {
    const response = await fetch('/api/admin/iletisim-mesajlari', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: mesaj.id, okundu }),
    });
    if (response.ok) setMesajlar(mesajlar.map((m) => (m.id === mesaj.id ? { ...m, okundu } : m)));
  };

  const sil = async (mesaj: Mesaj) => {
    if (!confirm(`${mesaj.ad_soyad} adlı kişinin mesajı silinsin mi?`)) return;
    const response = await fetch(`/api/admin/iletisim-mesajlari?id=${mesaj.id}`, { method: 'DELETE' });
    if (response.ok) setMesajlar(mesajlar.filter((m) => m.id !== mesaj.id));
    else alert('Mesaj silinemedi');
  };

  const okunmamisSayisi = mesajlar.filter((m) => !m.okundu).length;
  const gorunenler = sadeceOkunmamis ? mesajlar.filter((m) => !m.okundu) : mesajlar;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-gray-700">
          <span className="font-bold">{mesajlar.length}</span> mesaj
          {okunmamisSayisi > 0 && <span className="ml-2 text-orange-600 font-semibold">({okunmamisSayisi} okunmamış)</span>}
        </p>
        <div className="flex gap-2">
          {[false, true].map((secim) => (
            <button
              key={String(secim)}
              onClick={() => setSadeceOkunmamis(secim)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                sadeceOkunmamis === secim ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {secim ? '✉️ Okunmamış' : '📬 Tümü'}
            </button>
          ))}
        </div>
      </div>

      {hata && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">{hata}</div>}

      {yukleniyor ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">Yükleniyor...</div>
      ) : gorunenler.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
          {sadeceOkunmamis ? 'Okunmamış mesaj yok' : 'Henüz mesaj gelmedi'}
        </div>
      ) : (
        <div className="space-y-4">
          {gorunenler.map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${m.okundu ? 'border-gray-200' : 'border-orange-500'}`}
            >
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {!m.okundu && <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2 align-middle" />}
                    {m.ad_soyad}
                  </h3>
                  <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {m.telefon && (
                      <a href={`tel:${m.telefon}`} className="text-blue-600 hover:underline">
                        📞 {m.telefon}
                      </a>
                    )}
                    {m.eposta && (
                      <a href={`mailto:${m.eposta}`} className="text-blue-600 hover:underline">
                        ✉️ {m.eposta}
                      </a>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(m.created_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{m.mesaj}</p>
              <div className="flex gap-2 pt-4 mt-4 border-t">
                <button
                  onClick={() => okunduYap(m, !m.okundu)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
                >
                  {m.okundu ? 'Okunmadı yap' : '✓ Okundu yap'}
                </button>
                <button
                  onClick={() => sil(m)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition"
                >
                  🗑️ Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
