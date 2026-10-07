'use client';

import { useState } from 'react';

export default function TestSyncPage() {
  const [sonuc, setSonuc] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function sync() {
    setYukleniyor(true);
    try {
      const res = await fetch('/api/admin/sync-kategori-resim', { method: 'POST' });
      const data = await res.json();
      setSonuc(data);
    } catch (err) {
      setSonuc({ error: String(err) });
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Kategori Resim Senkronizasyonu</h1>
      <p className="mb-4 text-gray-600">
        Kategori resmi olan ama ana sayfa resmi olmayan firmaların ana sayfa resmini günceller.
      </p>

      <button
        onClick={sync}
        disabled={yukleniyor}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {yukleniyor ? 'Güncelleniyor...' : 'Senkronize Et'}
      </button>

      {sonuc && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <pre className="text-sm overflow-auto">{JSON.stringify(sonuc, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
