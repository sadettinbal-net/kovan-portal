'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Yönetici Paneli sekmeleri: içerikleri daha sonra doldurulacak
const SEKMELER = [
  { id: 'firma-onaylari', baslik: 'Firma Onayları', ikon: '🏢' },
  { id: 'ilan-onaylari', baslik: 'İlan Onayları', ikon: '📝' },
  { id: 'ilan-yonetimi', baslik: 'İlan Yönetimi', ikon: '📋' },
  { id: 'uyeler', baslik: 'Üyeler', ikon: '👥' },
  { id: 'guncelleme-talepleri', baslik: 'Güncelleme Talepleri', ikon: '🔄' },
  { id: 'istatistikler', baslik: 'İstatistikler', ikon: '📊' },
  { id: 'site-kullanimi', baslik: 'Site Kullanımı', ikon: '🌐' },
  { id: 'reklamlar', baslik: 'Reklamlar', ikon: '📢' },
];

export default function YoneticiPaneliPage() {
  const router = useRouter();
  const [aktifSekme, setAktifSekme] = useState(SEKMELER[0].id);

  useEffect(() => {
    checkAuth();
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

  const sekme = SEKMELER.find((s) => s.id === aktifSekme)!;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">🛡️ Yönetici Paneli</h1>
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
        {/* Sekmeler */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SEKMELER.map((s) => (
            <button
              key={s.id}
              onClick={() => setAktifSekme(s.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                aktifSekme === s.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {s.ikon} {s.baslik}
            </button>
          ))}
        </div>

        {/* Sekme içeriği */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">{sekme.ikon}</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{sekme.baslik}</h2>
          <p className="text-gray-600">Bu bölümün içeriği hazırlanıyor.</p>
          {sekme.id === 'uyeler' && (
            <button
              onClick={() => router.push('/admin/uyeler')}
              className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Mevcut Üyeler sayfasını aç →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
