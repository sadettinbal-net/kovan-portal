'use client';

import { useState, useEffect } from 'react';
import KonumSecici from '@/components/KonumSecici';
import { useRouter, useParams } from 'next/navigation';

export default function FirmaDuzenlePage() {
  const params = useParams();
  const firmaId = params.id as string;

  const [formData, setFormData] = useState({
    dukkan_adi: '',
    usta_adi: '',
    telefon: '',
    site_id: '',
    mahalle_id: '',
    sokak_id: '',
    blok_no: '',
    web_sitesi: '',
    alt_kategori_id: '',
  });
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [altKategoriler, setAltKategoriler] = useState<any[]>([]);
  const [siteler, setSiteler] = useState<any[]>([]);
  const [seciliKategori, setSeciliKategori] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadKategoriler();
    loadSiteler();
    loadFirma();
  }, []);

  useEffect(() => {
    if (seciliKategori) {
      loadAltKategoriler(parseInt(seciliKategori));
    } else {
      setAltKategoriler([]);
    }
  }, [seciliKategori]);

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

  const loadKategoriler = async () => {
    try {
      const response = await fetch('/api/admin/kategoriler');
      if (response.ok) {
        const data = await response.json();
        setKategoriler(data);
      }
    } catch (error) {
      console.error('Kategori yükleme hatası:', error);
    }
  };

  const loadSiteler = async () => {
    try {
      const response = await fetch('/api/admin/sanayi-siteleri');
      if (response.ok) {
        setSiteler(await response.json());
      }
    } catch (error) {
      console.error('Sanayi sitesi yükleme hatası:', error);
    }
  };

  const loadAltKategoriler = async (kategoriId: number) => {
    try {
      const response = await fetch(`/api/admin/kategoriler/${kategoriId}/alt-kategoriler`);
      if (response.ok) {
        const data = await response.json();
        setAltKategoriler(data);
      }
    } catch (error) {
      console.error('Alt kategori yükleme hatası:', error);
    }
  };

  const loadFirma = async () => {
    try {
      const response = await fetch(`/api/admin/firmalar/${firmaId}`);
      if (response.ok) {
        const firma = await response.json();
        setFormData({
          dukkan_adi: firma.dukkan_adi || '',
          usta_adi: firma.usta_adi || '',
          telefon: firma.telefon || '',
          site_id: firma.site_id?.toString() || '',
          mahalle_id: firma.mahalle_id?.toString() || '',
          sokak_id: firma.sokak_id?.toString() || '',
          blok_no: firma.blok_no || '',
          web_sitesi: firma.web_sitesi || '',
          alt_kategori_id: firma.alt_kategori_id?.toString() || '',
        });

        // Eğer firma alt kategorisi varsa, onun kategorisini bul
        if (firma.alt_kategori_id) {
          const altKatResponse = await fetch(`/api/admin/alt-kategoriler/${firma.alt_kategori_id}`);
          if (altKatResponse.ok) {
            const altKat = await altKatResponse.json();
            setSeciliKategori(altKat.kategori_id?.toString() || '');
          }
        }
      } else {
        setError('Firma bulunamadı');
      }
    } catch (error) {
      setError('Firma yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!formData.dukkan_adi) {
      setError('Dükkan adı zorunludur');
      setSaving(false);
      return;
    }

    if (!formData.mahalle_id && !formData.site_id) {
      setError('Lütfen dükkanın mahallesini ya da sanayi sitesini seçin');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/firmalar/${firmaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dukkan_adi: formData.dukkan_adi,
          usta_adi: formData.usta_adi,
          telefon: formData.telefon || null,
          blok_no: formData.blok_no || null,
          web_sitesi: formData.web_sitesi || null,
          site_id: formData.site_id ? parseInt(formData.site_id) : null,
          mahalle_id: formData.mahalle_id ? parseInt(formData.mahalle_id) : null,
          sokak_id: formData.sokak_id ? parseInt(formData.sokak_id) : null,
          alt_kategori_id: formData.alt_kategori_id ? parseInt(formData.alt_kategori_id) : null,
          kategori:
            altKategoriler.find((a) => a.id.toString() === formData.alt_kategori_id)?.alt_kategori_adi ||
            kategoriler.find((k) => k.id.toString() === seciliKategori)?.kategori_adi ||
            null,
        }),
      });

      if (response.ok) {
        router.push('/admin/firmalar');
      } else {
        const data = await response.json();
        setError(data.error || 'Firma güncellenemedi');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Firma Düzenle</h1>
            <button
              onClick={() => router.push('/admin/firmalar')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              ← Geri Dön
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dükkan Adı */}
            <div>
              <label htmlFor="dukkan_adi" className="block text-sm font-medium text-gray-700 mb-2">
                Dükkan Adı <span className="text-red-500">*</span>
              </label>
              <input
                id="dukkan_adi"
                type="text"
                value={formData.dukkan_adi}
                onChange={(e) => setFormData({ ...formData, dukkan_adi: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Usta Adı */}
            <div>
              <label htmlFor="usta_adi" className="block text-sm font-medium text-gray-700 mb-2">
                Usta Adı
              </label>
              <input
                id="usta_adi"
                type="text"
                value={formData.usta_adi}
                onChange={(e) => setFormData({ ...formData, usta_adi: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Telefon */}
            <div>
              <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                id="telefon"
                type="tel"
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Kategori Seçimi */}
            <div>
              <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                id="kategori"
                value={seciliKategori}
                onChange={(e) => {
                  setSeciliKategori(e.target.value);
                  setFormData({ ...formData, alt_kategori_id: '' });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Kategori seçiniz</option>
                {kategoriler.map((kat) => (
                  <option key={kat.id} value={kat.id}>
                    {kat.kategori_adi}
                  </option>
                ))}
              </select>
            </div>

            {/* Alt Kategori Seçimi */}
            {seciliKategori && (
              <div>
                <label htmlFor="alt_kategori" className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Kategori
                </label>
                <select
                  id="alt_kategori"
                  value={formData.alt_kategori_id}
                  onChange={(e) => setFormData({ ...formData, alt_kategori_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Alt kategori seçiniz (opsiyonel)</option>
                  {altKategoriler.map((altKat) => (
                    <option key={altKat.id} value={altKat.id}>
                      {altKat.alt_kategori_adi}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Konum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konum (Mahalle / Sokak)
              </label>
              <KonumSecici
                mahalleId={formData.mahalle_id}
                sokakId={formData.sokak_id}
                onChange={({ mahalleId, sokakId }) =>
                  setFormData((onceki) => ({ ...onceki, mahalle_id: mahalleId, sokak_id: sokakId }))
                }
              />
              <p className="text-xs text-gray-500 mt-2">
                Mahalle dükkanları için mahalle seçmek yeterli, sokak isteğe bağlı. Sanayi sitesindeki dükkanlar için aşağıdan sanayi sitesini seçin.
              </p>
            </div>

            {/* Sanayi Sitesi */}
            <div>
              <label htmlFor="site_id" className="block text-sm font-medium text-gray-700 mb-2">
                Sanayi Sitesi
              </label>
              <select
                id="site_id"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Sanayi sitesi seçiniz (opsiyonel)</option>
                {siteler.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.site_adi}{site.il_adi ? ` (${site.il_adi}${site.ilce_adi ? ' / ' + site.ilce_adi : ''})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Blok No */}
            <div>
              <label htmlFor="blok_no" className="block text-sm font-medium text-gray-700 mb-2">
                Blok / Dükkan No
              </label>
              <input
                id="blok_no"
                type="text"
                value={formData.blok_no}
                onChange={(e) => setFormData({ ...formData, blok_no: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Örn: A Blok No: 12"
              />
            </div>

            {/* Web Sitesi */}
            <div>
              <label htmlFor="web_sitesi" className="block text-sm font-medium text-gray-700 mb-2">
                Web Sitesi
              </label>
              <input
                id="web_sitesi"
                type="url"
                value={formData.web_sitesi}
                onChange={(e) => setFormData({ ...formData, web_sitesi: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => router.push('/admin/firmalar')}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
