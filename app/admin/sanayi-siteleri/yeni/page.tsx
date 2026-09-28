'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function YeniSanayiSitesiPage() {
  const [formData, setFormData] = useState({
    site_adi: '',
    il_adi: '',
    ilce_adi: '',
    adres: '',
  });
  const [iller, setIller] = useState<any[]>([]);
  const [ilceler, setIlceler] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadIller();
  }, []);

  useEffect(() => {
    if (formData.il_adi) {
      loadIlceler(formData.il_adi);
    } else {
      setIlceler([]);
    }
  }, [formData.il_adi]);

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
        const data = await response.json();
        setIller(data);
      }
    } catch (error) {
      console.error('İl yükleme hatası:', error);
    }
  };

  const loadIlceler = async (ilAdi: string) => {
    try {
      const response = await fetch(`/api/admin/iller/${encodeURIComponent(ilAdi)}/ilceler`);
      if (response.ok) {
        const data = await response.json();
        setIlceler(data);
      }
    } catch (error) {
      console.error('İlçe yükleme hatası:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.site_adi || !formData.il_adi) {
      setError('Site adı ve il zorunludur');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/sanayi-siteleri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_adi: formData.site_adi,
          il_adi: formData.il_adi.toLocaleUpperCase('tr-TR'),
          ilce_adi: formData.ilce_adi || null,
          adres: formData.adres || null,
        }),
      });

      if (response.ok) {
        router.push('/admin/sanayi-siteleri');
      } else {
        const data = await response.json();
        setError(data.error || 'Sanayi sitesi eklenemedi');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Yeni Sanayi Sitesi Ekle</h1>
            <button
              onClick={() => router.push('/admin/sanayi-siteleri')}
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
            {/* Site Adı */}
            <div>
              <label htmlFor="site_adi" className="block text-sm font-medium text-gray-700 mb-2">
                Sanayi Sitesi Adı <span className="text-red-500">*</span>
              </label>
              <input
                id="site_adi"
                type="text"
                value={formData.site_adi}
                onChange={(e) => setFormData({ ...formData, site_adi: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Örn: Ümraniye Organize Sanayi Bölgesi"
              />
            </div>

            {/* İl Seçimi */}
            <div>
              <label htmlFor="il_adi" className="block text-sm font-medium text-gray-700 mb-2">
                İl <span className="text-red-500">*</span>
              </label>
              <select
                id="il_adi"
                value={formData.il_adi}
                onChange={(e) => {
                  setFormData({ ...formData, il_adi: e.target.value, ilce_adi: '' });
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="">İl seçiniz</option>
                {iller.map((il) => (
                  <option key={il.id} value={il.sehir_adi}>
                    {il.sehir_adi}
                  </option>
                ))}
              </select>
            </div>

            {/* İlçe Seçimi */}
            {formData.il_adi && (
              <div>
                <label htmlFor="ilce_adi" className="block text-sm font-medium text-gray-700 mb-2">
                  İlçe
                </label>
                <select
                  id="ilce_adi"
                  value={formData.ilce_adi}
                  onChange={(e) => setFormData({ ...formData, ilce_adi: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">İlçe seçiniz (opsiyonel)</option>
                  {ilceler.map((ilce) => (
                    <option key={ilce.id} value={ilce.ilce_adi}>
                      {ilce.ilce_adi}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Adres */}
            <div>
              <label htmlFor="adres" className="block text-sm font-medium text-gray-700 mb-2">
                Adres
              </label>
              <textarea
                id="adres"
                value={formData.adres}
                onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                placeholder="Tam adres bilgisi..."
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
                onClick={() => router.push('/admin/sanayi-siteleri')}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Ekleniyor...' : 'Sanayi Sitesi Ekle'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
