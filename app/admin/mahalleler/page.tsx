'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Mahalle {
  id: number;
  mahalle_id: number;
  mahalle_adi: string;
}

export default function MahallelerPage() {
  const [sekme, setSekme] = useState<'liste' | 'ekle'>('liste');
  const [iller, setIller] = useState<any[]>([]);
  const [ilceler, setIlceler] = useState<any[]>([]);
  const [mahalleler, setMahalleler] = useState<Mahalle[]>([]);
  const [ilAdi, setIlAdi] = useState('');
  const [ilceId, setIlceId] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');
  const [yeniMahalleAdi, setYeniMahalleAdi] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [basari, setBasari] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadIller();
  }, []);

  useEffect(() => {
    setIlceId('');
    setIlceler([]);
    if (ilAdi) loadIlceler(ilAdi);
  }, [ilAdi]);

  useEffect(() => {
    setMahalleler([]);
    if (ilceId) loadMahalleler(ilceId);
  }, [ilceId]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/check-auth');
      if (!response.ok) {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const loadIller = async () => {
    try {
      const response = await fetch('/api/admin/iller');
      if (response.ok) {
        setIller(await response.json());
      }
    } catch (error) {
      console.error('İl yükleme hatası:', error);
    }
  };

  const loadIlceler = async (il: string) => {
    try {
      const response = await fetch(`/api/admin/iller/${encodeURIComponent(il)}/ilceler`);
      if (response.ok) {
        setIlceler(await response.json());
      }
    } catch (error) {
      console.error('İlçe yükleme hatası:', error);
    }
  };

  const loadMahalleler = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/mahalleler?ilce_id=${id}`);
      if (response.ok) {
        setMahalleler(await response.json());
      }
    } catch (error) {
      console.error('Mahalle yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEkle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBasari('');

    if (!ilceId || !yeniMahalleAdi.trim()) {
      setError('İl, ilçe ve mahalle adı zorunludur');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/mahalleler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ilce_id: parseInt(ilceId), mahalle_adi: yeniMahalleAdi }),
      });
      const data = await response.json();

      if (response.ok) {
        setBasari(`${data.mahalle_adi} eklendi`);
        setYeniMahalleAdi('');
        loadMahalleler(ilceId);
      } else {
        setError(data.error || 'Mahalle eklenemedi');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const filtreliMahalleler = mahalleler.filter((m) =>
    m.mahalle_adi?.toLocaleLowerCase('tr-TR').includes(aramaMetni.toLocaleLowerCase('tr-TR'))
  );

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';

  const sekmeClass = (aktif: boolean) =>
    `px-5 py-3 font-semibold border-b-2 transition ${
      aktif ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Mahalle Yönetimi</h1>
              {ilceId && <p className="text-gray-600 mt-1">Bu ilçede {mahalleler.length} mahalle</p>}
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* İl / İlçe seçimi (iki sekme için ortak) */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={ilAdi} onChange={(e) => setIlAdi(e.target.value)} className={inputClass}>
            <option value="">İl seçiniz</option>
            {iller.map((il) => (
              <option key={il.id} value={il.sehir_adi}>
                {il.sehir_adi}
              </option>
            ))}
          </select>
          <select
            value={ilceId}
            onChange={(e) => setIlceId(e.target.value)}
            disabled={!ilAdi}
            className={`${inputClass} disabled:bg-gray-100`}
          >
            <option value="">İlçe seçiniz</option>
            {ilceler.map((ilce) => (
              <option key={ilce.id} value={ilce.id}>
                {ilce.ilce_adi}
              </option>
            ))}
          </select>
        </div>

        {/* Sekmeler */}
        <div className="bg-white rounded-t-lg shadow-md flex border-b border-gray-200">
          <button onClick={() => setSekme('liste')} className={sekmeClass(sekme === 'liste')}>
            Mahalleler
          </button>
          <button onClick={() => setSekme('ekle')} className={sekmeClass(sekme === 'ekle')}>
            + Mahalle Ekle
          </button>
        </div>

        <div className="bg-white rounded-b-lg shadow-md p-6">
          {sekme === 'liste' && (
            <>
              {!ilceId ? (
                <p className="text-center text-gray-500 py-8">Mahalleleri görmek için il ve ilçe seçin</p>
              ) : loading ? (
                <p className="text-center text-gray-500 py-8">Yükleniyor...</p>
              ) : (
                <>
                  <input
                    type="text"
                    value={aramaMetni}
                    onChange={(e) => setAramaMetni(e.target.value)}
                    placeholder="Mahalle ara..."
                    className={`${inputClass} mb-4`}
                  />
                  {filtreliMahalleler.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {aramaMetni ? 'Arama sonucu bulunamadı' : 'Bu ilçede mahalle yok'}
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {filtreliMahalleler.map((m) => (
                        <li key={m.id} className="py-3 text-sm text-gray-800">
                          {m.mahalle_adi}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}

          {sekme === 'ekle' && (
            <form onSubmit={handleEkle} className="space-y-6 max-w-xl">
              {!ilceId && (
                <p className="text-sm text-gray-500">Önce yukarıdan mahallenin il ve ilçesini seçin.</p>
              )}
              <div>
                <label htmlFor="mahalle_adi" className="block text-sm font-medium text-gray-700 mb-2">
                  Mahalle Adı <span className="text-red-500">*</span>
                </label>
                <input
                  id="mahalle_adi"
                  type="text"
                  value={yeniMahalleAdi}
                  onChange={(e) => setYeniMahalleAdi(e.target.value)}
                  disabled={!ilceId}
                  className={`${inputClass} disabled:bg-gray-100`}
                  placeholder="Örn: Cumhuriyet"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Sonuna &quot;Mahallesi&quot; yazmanıza gerek yok, otomatik eklenir.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {basari && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {basari}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !ilceId}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Ekleniyor...' : 'Mahalleyi Ekle'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
