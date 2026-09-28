'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Firma {
  id: number;
  dukkan_adi: string;
  usta_adi?: string;
  telefon?: string;
  cep_telefonu?: string;
  whatsapp?: string;
  kategori?: string;
  blok_no?: string;
  site_id?: number;
  alt_kategori_id?: number;
  created_at?: string;
}

export default function FirmalarPage() {
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [loading, setLoading] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [silmeOnay, setSilmeOnay] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadFirmalar();
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

  const loadFirmalar = async () => {
    try {
      const response = await fetch('/api/admin/firmalar');
      if (response.ok) {
        const data = await response.json();
        setFirmalar(data);
      }
    } catch (error) {
      console.error('Firma yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/firmalar/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFirmalar(firmalar.filter(f => f.id !== id));
        setSilmeOnay(null);
      } else {
        alert('Silme işlemi başarısız');
      }
    } catch (error) {
      alert('Bir hata oluştu');
    }
  };

  const filtreliFirmalar = firmalar.filter(firma =>
    firma.dukkan_adi?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    firma.usta_adi?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    firma.telefon?.includes(aramaMetni) ||
    firma.cep_telefonu?.includes(aramaMetni) ||
    firma.whatsapp?.includes(aramaMetni)
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
              <h1 className="text-2xl font-bold text-gray-800">Firma Yönetimi</h1>
              <p className="text-gray-600 mt-1">Toplam {firmalar.length} firma</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                ← Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/firmalar/yeni')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                + Yeni Firma Ekle
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
            placeholder="Dükkan adı, usta veya telefon ile ara..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Firmalar Listesi */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dükkan Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtreliFirmalar.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {aramaMetni ? 'Arama sonucu bulunamadı' : 'Henüz firma eklenmemiş'}
                    </td>
                  </tr>
                ) : (
                  filtreliFirmalar.map((firma) => (
                    <tr key={firma.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{firma.dukkan_adi}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{firma.usta_adi || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {firma.telefon || firma.cep_telefonu || firma.whatsapp ? (
                          <div className="text-sm text-gray-600 font-mono space-y-1">
                            {firma.telefon && <div>📞 {firma.telefon}</div>}
                            {firma.cep_telefonu && <div>📱 {firma.cep_telefonu}</div>}
                            {firma.whatsapp && <div className="text-green-700">💬 {firma.whatsapp}</div>}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">{firma.kategori || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/admin/firmalar/${firma.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Düzenle
                        </button>
                        {silmeOnay === firma.id ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleDelete(firma.id)}
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
                            onClick={() => setSilmeOnay(firma.id)}
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
