'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Uye {
  id: string;
  ad?: string;
  soyad?: string;
  telefon?: string;
  cep_telefonu?: string;
  email?: string;
  giris_yontemi?: string;
  created_at: string;
  email_onayli: boolean;
  son_giris: string | null;
}

const tarih = (deger: string | null) =>
  deger
    ? new Date(deger).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';

export default function UyelerPage() {
  const [uyeler, setUyeler] = useState<Uye[]>([]);
  const [loading, setLoading] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [siliniyor, setSiliniyor] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadUyeler();
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

  const loadUyeler = async () => {
    try {
      const response = await fetch('/api/admin/uyeler');
      if (response.ok) {
        setUyeler(await response.json());
      }
    } catch (error) {
      console.error('Üye yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const uyeSil = async (uyeId: string, adSoyad: string) => {
    if (!confirm(`${adSoyad} adlı üyeyi silmek istediğinize emin misiniz?`)) {
      return;
    }

    setSiliniyor(uyeId);
    try {
      const response = await fetch(`/api/admin/uyeler?id=${uyeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUyeler(uyeler.filter((u) => u.id !== uyeId));
        alert('Üye başarıyla silindi');
      } else {
        alert('Üye silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Üye silinirken bir hata oluştu');
    } finally {
      setSiliniyor(null);
    }
  };

  const arama = aramaMetni.toLocaleLowerCase('tr-TR');
  const filtreliUyeler = uyeler.filter((uye) =>
    [uye.ad, uye.soyad, uye.email, uye.telefon, uye.cep_telefonu].some((alan) =>
      alan?.toLocaleLowerCase('tr-TR').includes(arama)
    )
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
              <h1 className="text-2xl font-bold text-gray-800">Üyeler</h1>
              <p className="text-gray-600 mt-1">Toplam {uyeler.length} üye</p>
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
        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            placeholder="Ad, soyad, e-posta veya telefon ile ara..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Üye Listesi */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üyelik</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kayıt / Son Giriş</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtreliUyeler.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {aramaMetni ? 'Arama sonucu bulunamadı' : 'Henüz üye yok'}
                    </td>
                  </tr>
                ) : (
                  filtreliUyeler.map((uye) => (
                    <tr key={uye.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {[uye.ad, uye.soyad].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>{uye.email || '-'}</div>
                        {!uye.email_onayli && <div className="text-xs text-orange-600">E-posta onaylanmadı</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono space-y-1">
                        {uye.telefon && <div>📞 {uye.telefon}</div>}
                        {uye.cep_telefonu && <div>📱 {uye.cep_telefonu}</div>}
                        {!uye.telefon && !uye.cep_telefonu && '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            uye.giris_yontemi === 'google' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {uye.giris_yontemi === 'google' ? 'Google' : 'E-posta'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        <div>Kayıt: {tarih(uye.created_at)}</div>
                        <div>Son giriş: {tarih(uye.son_giris)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => uyeSil(uye.id, [uye.ad, uye.soyad].filter(Boolean).join(' ') || uye.email || 'Bu üye')}
                          disabled={siliniyor === uye.id}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {siliniyor === uye.id ? 'Siliniyor...' : '🗑️ Sil'}
                        </button>
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
