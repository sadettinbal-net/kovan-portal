'use client';

import { useEffect, useState } from 'react';
import { SEKTORLER_SITELI } from '@/lib/sektorler-siteli';
import { SEKTORLER_SITESIZ } from '@/lib/sektorler-sitesiz';

type Kategori = {
  ad: string;
  tip: 'siteli' | 'sitesiz';
  firma_sayisi: number;
};

const INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] bg-white';

export default function KategoriYonetimi() {
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [tipFilter, setTipFilter] = useState<'hepsi' | 'siteli' | 'sitesiz'>('hepsi');
  const [arama, setArama] = useState('');
  const [yeniKategori, setYeniKategori] = useState({ ad: '', tip: 'siteli' as 'siteli' | 'sitesiz' });
  const [mesaj, setMesaj] = useState('');
  const [duzenleniyorKategori, setDuzenleniyorKategori] = useState<{ eskiAd: string; yeniAd: string; tip: 'siteli' | 'sitesiz' } | null>(null);

  async function yukle() {
    setYukleniyor(true);
    try {
      // Sanayi siteli firmalardan kategorileri al
      const resSiteli = await fetch('/api/kategoriler?tip=siteli');
      const dataSiteli = await resSiteli.json();

      // Sanayi sitesiz firmalardan kategorileri al
      const resSitesiz = await fetch('/api/kategoriler?tip=sitesiz');
      const dataSitesiz = await resSitesiz.json();

      const tumKategoriler: Kategori[] = [
        ...dataSiteli.map((k: any) => ({ ad: k.kategori, tip: 'siteli' as const, firma_sayisi: k.sayi })),
        ...dataSitesiz.map((k: any) => ({ ad: k.kategori, tip: 'sitesiz' as const, firma_sayisi: k.sayi }))
      ];

      setKategoriler(tumKategoriler);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
    setYukleniyor(false);
  }

  useEffect(() => {
    yukle();
  }, []);

  async function kategoriEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!yeniKategori.ad.trim()) {
      setMesaj('⚠️ Kategori adı boş olamaz!');
      setTimeout(() => setMesaj(''), 3000);
      return;
    }

    try {
      const res = await fetch('/api/kategoriler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad: yeniKategori.ad.trim().toUpperCase(), tip: yeniKategori.tip })
      });

      const data = await res.json();
      if (res.ok) {
        setMesaj('✅ Kategori başarıyla eklendi!');
        setYeniKategori({ ad: '', tip: 'siteli' });
        yukle();
        setTimeout(() => setMesaj(''), 3000);
      } else {
        setMesaj('❌ ' + data.error);
        setTimeout(() => setMesaj(''), 3000);
      }
    } catch (error) {
      setMesaj('❌ Kategori eklenirken hata oluştu!');
      setTimeout(() => setMesaj(''), 3000);
    }
  }

  async function kategoriDuzenle() {
    if (!duzenleniyorKategori || !duzenleniyorKategori.yeniAd.trim()) {
      setMesaj('⚠️ Kategori adı boş olamaz!');
      setTimeout(() => setMesaj(''), 3000);
      return;
    }

    try {
      const res = await fetch('/api/kategoriler', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eskiAd: duzenleniyorKategori.eskiAd,
          yeniAd: duzenleniyorKategori.yeniAd.trim().toUpperCase(),
          tip: duzenleniyorKategori.tip
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMesaj('✅ Kategori başarıyla güncellendi!');
        setDuzenleniyorKategori(null);
        yukle();
        setTimeout(() => setMesaj(''), 3000);
      } else {
        setMesaj('❌ ' + data.error);
        setTimeout(() => setMesaj(''), 3000);
      }
    } catch (error) {
      setMesaj('❌ Kategori güncellenirken hata oluştu!');
      setTimeout(() => setMesaj(''), 3000);
    }
  }

  async function kategoriSil(ad: string, tip: 'siteli' | 'sitesiz') {
    if (!confirm(`"${ad}" kategorisini silmek istediğinize emin misiniz? Bu kategorideki firmalar "DİĞER FİRMALAR" kategorisine taşınacak.`)) {
      return;
    }

    try {
      const res = await fetch('/api/kategoriler', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad, tip })
      });

      const data = await res.json();
      if (res.ok) {
        setMesaj('✅ Kategori başarıyla silindi!');
        yukle();
        setTimeout(() => setMesaj(''), 3000);
      } else {
        setMesaj('❌ ' + data.error);
        setTimeout(() => setMesaj(''), 3000);
      }
    } catch (error) {
      setMesaj('❌ Kategori silinirken hata oluştu!');
      setTimeout(() => setMesaj(''), 3000);
    }
  }

  const gorunenler = kategoriler.filter(k => {
    if (tipFilter !== 'hepsi' && k.tip !== tipFilter) return false;
    if (!arama) return true;
    return k.ad.toLocaleLowerCase('tr-TR').includes(arama.toLocaleLowerCase('tr-TR'));
  });

  // Sabit listelerden olmayan kategoriler
  const sabitListesi = tipFilter === 'siteli' ? SEKTORLER_SITELI : SEKTORLER_SITESIZ;
  const ekKategoriler = gorunenler.filter(k =>
    tipFilter === 'hepsi' || !sabitListesi.includes(k.ad)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-[#1a3a6b] mb-4">📂 Kategori Yönetimi</h2>

        {mesaj && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {mesaj}
          </div>
        )}

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            placeholder="Kategori ara..."
            value={arama}
            onChange={e => setArama(e.target.value)}
            className={INPUT}
          />
          <select
            value={tipFilter}
            onChange={e => setTipFilter(e.target.value as any)}
            className={INPUT}
          >
            <option value="hepsi">Tüm Kategoriler</option>
            <option value="siteli">🏗️ Sanayi Sitesi İçi</option>
            <option value="sitesiz">🏪 Sanayi Sitesi Dışı</option>
          </select>
        </div>

        {/* Yeni Kategori Ekleme Formu */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3">➕ Yeni Kategori Ekle</h3>
          <form onSubmit={kategoriEkle} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Kategori adı (örn: YAZILIM & BİLİŞİM)"
              value={yeniKategori.ad}
              onChange={e => setYeniKategori(prev => ({ ...prev, ad: e.target.value }))}
              className={INPUT}
              required
            />
            <select
              value={yeniKategori.tip}
              onChange={e => setYeniKategori(prev => ({ ...prev, tip: e.target.value as 'siteli' | 'sitesiz' }))}
              className={INPUT}
            >
              <option value="siteli">🏗️ Sanayi Sitesi İçi</option>
              <option value="sitesiz">🏪 Sanayi Sitesi Dışı</option>
            </select>
            <button
              type="submit"
              className="bg-[#1a3a6b] hover:bg-[#2a4a7b] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Ekle
            </button>
          </form>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-[#1a3a6b]">{kategoriler.filter(k => k.tip === 'siteli').length}</div>
            <div className="text-xs text-gray-600">Sanayi Sitesi İçi</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-2xl font-bold text-[#e8a020]">{kategoriler.filter(k => k.tip === 'sitesiz').length}</div>
            <div className="text-xs text-gray-600">Sanayi Sitesi Dışı</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-700">{kategoriler.length}</div>
            <div className="text-xs text-gray-600">Toplam Kategori</div>
          </div>
        </div>

        {/* Kategori Listesi */}
        {yukleniyor ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-4 border-[#1a3a6b] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Kategori Adı</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Tip</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Firma Sayısı</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Durum</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {gorunenler.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Kategori bulunamadı
                    </td>
                  </tr>
                ) : (
                  gorunenler
                    .sort((a, b) => b.firma_sayisi - a.firma_sayisi || a.ad.localeCompare(b.ad, 'tr'))
                    .map((kat, i) => {
                      const sabitMi = (kat.tip === 'siteli' ? SEKTORLER_SITELI : SEKTORLER_SITESIZ).includes(kat.ad);
                      return (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{kat.ad}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              kat.tip === 'siteli'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {kat.tip === 'siteli' ? '🏗️ Siteli' : '🏪 Sitesiz'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">
                              {kat.firma_sayisi}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              sabitMi
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {sabitMi ? '✓ Sabit' : '• Dinamik'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {!sabitMi && (
                                <>
                                  <button
                                    onClick={() => setDuzenleniyorKategori({ eskiAd: kat.ad, yeniAd: kat.ad, tip: kat.tip })}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                  >
                                    ✏️ Düzenle
                                  </button>
                                  <button
                                    onClick={() => kategoriSil(kat.ad, kat.tip)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                  >
                                    🗑️ Sil
                                  </button>
                                </>
                              )}
                              {sabitMi && (
                                <span className="text-xs text-gray-400">Düzenlenemez</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Düzenleme Modalı */}
        {duzenleniyorKategori && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDuzenleniyorKategori(null)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[#1a3a6b] mb-4">✏️ Kategori Düzenle</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Adı</label>
                  <input
                    type="text"
                    value={duzenleniyorKategori.yeniAd}
                    onChange={e => setDuzenleniyorKategori(prev => prev ? { ...prev, yeniAd: e.target.value } : null)}
                    className={INPUT}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
                  <select
                    value={duzenleniyorKategori.tip}
                    onChange={e => setDuzenleniyorKategori(prev => prev ? { ...prev, tip: e.target.value as 'siteli' | 'sitesiz' } : null)}
                    className={INPUT}
                  >
                    <option value="siteli">🏗️ Sanayi Sitesi İçi</option>
                    <option value="sitesiz">🏪 Sanayi Sitesi Dışı</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={kategoriDuzenle}
                    className="flex-1 bg-[#1a3a6b] hover:bg-[#2a4a7b] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setDuzenleniyorKategori(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Açıklama */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Kategori Sistemi</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Sabit Kategoriler:</strong> Kod tarafında tanımlı, her zaman form listesinde görünür</li>
                <li>• <strong>Dinamik Kategoriler:</strong> Firmalar tarafından eklenmiş, veritabanından gelen kategoriler</li>
                <li>• <strong>Sanayi Sitesi İçi:</strong> Oto tamir, elektrik, makina imalat gibi sanayi kategorileri</li>
                <li>• <strong>Sanayi Sitesi Dışı:</strong> Berber, kafe, market gibi genel işletme kategorileri</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
