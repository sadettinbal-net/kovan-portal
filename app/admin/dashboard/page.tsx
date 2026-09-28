'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalFirmalar: 0,
    totalIller: 0,
    totalIlceler: 0,
    totalMahalleler: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadStats();
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

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Kovan Portal Admin</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Çıkış Yap
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Toplam Firma"
            value={stats.totalFirmalar}
            icon="🏭"
            color="blue"
          />
          <StatCard
            title="Toplam İl"
            value={stats.totalIller}
            icon="🗺️"
            color="green"
          />
          <StatCard
            title="Toplam İlçe"
            value={stats.totalIlceler}
            icon="📍"
            color="yellow"
          />
          <StatCard
            title="Toplam Mahalle"
            value={stats.totalMahalleler}
            icon="🏘️"
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton
              title="Firma Ekle"
              description="Yeni firma kaydı oluştur"
              href="/admin/firmalar/yeni"
              icon="➕"
            />
            <ActionButton
              title="Firmaları Yönet"
              description="Mevcut firmaları düzenle"
              href="/admin/firmalar"
              icon="✏️"
            />
            <ActionButton
              title="Sanayi Siteleri"
              description="Sanayi sitelerini yönet"
              href="/admin/sanayi-siteleri"
              icon="🏭"
            />
            <ActionButton
              title="Mahalle Yönetimi"
              description="Mahalle verilerini düzenle"
              href="/admin/mahalleler"
              icon="🏘️"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Son Aktiviteler</h2>
          <p className="text-gray-600">Yakında eklenecek...</p>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  }[color];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value.toLocaleString('tr-TR')}</p>
        </div>
        <div className={`${colorClasses} text-white text-3xl rounded-full w-14 h-14 flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ title, description, href, icon }: { title: string; description: string; href: string; icon: string }) {
  return (
    <a
      href={href}
      className="block p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-500 transition"
    >
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </a>
  );
}
