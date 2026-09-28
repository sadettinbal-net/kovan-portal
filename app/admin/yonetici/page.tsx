'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Yönetici Paneli: içeriği daha sonra eklenecek
export default function YoneticiPaneliPage() {
  const router = useRouter();

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
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🛠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Yakında</h2>
          <p className="text-gray-600">Bu panelin içeriği hazırlanıyor.</p>
        </div>
      </main>
    </div>
  );
}
