'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SanayiSitesi {
  id: number;
  site_adi: string;
  il_adi: string;
  ilce_adi?: string;
  mahalle_id?: number;
  adres?: string;
  created_at?: string;
}

export default function SanayiSiteleriPage() {
  const [siteler, setSiteler] = useState<SanayiSitesi[]>([]);
  const [loading, setLoading] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [silmeOnay, setSilmeOnay] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadSiteler();
  }, []);

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

  const loadSiteler = async () => {
    try {
      const response = await fetch('/api/admin/sanayi-siteleri');
      if (response.ok) {
        const data = await response.json();
        setSiteler(data);
      }
    } catch (error) {
      console.error('Site yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/sanayi-siteleri/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSiteler(siteler.filter(s => s.id !== id));
        setSilmeOnay(null);
      } else {
        alert('Silme işlemi başarısız');
      }
    } catch (error) {
      alert('Bir hata oluştu');
    }
  };

  const filtreliSiteler = siteler.filter(site =>
    site.site_adi?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    site.il_adi?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    site.ilce_adi?.toLowerCase().includes(aramaMetni.toLowerCase())
  );

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
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Sanayi Siteleri Yönetimi</h1>
              <p className="text-gray-600 mt-1">Toplam {siteler.length} sanayi sitesi</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                ← Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/sanayi-siteleri/yeni')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                + Yeni Sanayi Sitesi Ekle
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            placeholder="Site adı, il veya ilçe ile ara..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Siteler Listesi */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İl
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İlçe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adres
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtreliSiteler.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {aramaMetni ? 'Arama sonucu bulunamadı' : 'Henüz sanayi sitesi eklenmemiş'}
                    </td>
                  </tr>
                ) : (
                  filtreliSiteler.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{site.site_adi}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{site.il_adi}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{site.ilce_adi || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">{site.adres || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {silmeOnay === site.id ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleDelete(site.id)}
                              className="text-red-600 hover:text-red-900 font-bold"
                            >
                              Evet, Sil
                            </button>
                            <button
                              onClick={() => setSilmeOnay(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSilmeOnay(site.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
