'use client';

export default function DemoMaps() {
  const ornekFirmalar = [
    {
      id: 1,
      dukkan_adi: 'Demir Döküm Atölyesi',
      usta_adi: 'Mehmet Yılmaz',
      telefon: '0532 123 45 67',
      il: 'İstanbul',
      ilce: 'Ümraniye',
      kategori: { icon: '🔧', adi: 'Metal İşleme', renk: '#FF6B35' }
    },
    {
      id: 2,
      dukkan_adi: 'Oto Elektrik Ustası',
      usta_adi: 'Ahmet Kaya',
      telefon: '0533 234 56 78',
      il: 'İstanbul',
      ilce: 'Ümraniye',
      kategori: { icon: '⚡', adi: 'Elektrik', renk: '#4ECDC4' }
    },
    {
      id: 3,
      dukkan_adi: 'Boya Badana Ustası',
      usta_adi: 'Ali Demir',
      telefon: '0534 345 67 89',
      il: 'Ankara',
      ilce: 'Çankaya',
      kategori: { icon: '🎨', adi: 'Boya', renk: '#95E1D3' }
    },
    {
      id: 4,
      dukkan_adi: 'Mobilya Atölyesi',
      usta_adi: 'Hasan Öztürk',
      telefon: '0535 456 78 90',
      il: 'İzmir',
      ilce: 'Konak',
      kategori: { icon: '🪑', adi: 'Mobilya', renk: '#F38181' }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent mb-3">
            Google Maps Demo
          </h1>
          <p className="text-gray-600 font-medium">
            Firma kartlarında Google Maps butonu nasıl görünüyor?
          </p>
        </div>

        {/* Firmalar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ornekFirmalar.map((firma) => (
            <div
              key={firma.id}
              className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-black text-gray-800 uppercase leading-tight">
                  {firma.dukkan_adi}
                </h2>
                <span
                  style={{ backgroundColor: firma.kategori.renk }}
                  className="text-white text-xs px-3 py-1.5 rounded-xl font-black uppercase shadow-md whitespace-nowrap flex items-center gap-1.5"
                >
                  <span>{firma.kategori.icon}</span>
                  <span>{firma.kategori.adi}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4 text-gray-600">
                <span className="text-lg">👤</span>
                <p className="font-bold text-sm">{firma.usta_adi}</p>
              </div>

              <div className="flex items-center gap-2 mb-4 text-gray-600">
                <span className="text-lg">📍</span>
                <p className="text-sm font-medium">{firma.ilce}, {firma.il}</p>
              </div>

              <div className="space-y-3">
                {/* Telefon Butonu */}
                <a
                  href={`tel:${firma.telefon}`}
                  className="flex items-center justify-center w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 rounded-2xl font-bold gap-2 hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  <span className="text-xl">📞</span>
                  <span>{firma.telefon}</span>
                </a>

                {/* Google Maps Butonu - YENİ! */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${firma.dukkan_adi} ${firma.il} ${firma.ilce}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-2xl font-bold gap-2 hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  <span className="text-xl">🗺️</span>
                  <span>Google Maps'te Aç</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bilgi */}
        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl">
          <h3 className="text-lg font-bold text-blue-800 mb-2">
            ℹ️ Nasıl Çalışır?
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>✅ <strong>Mavi butona tıklayın</strong> → Google Maps yeni sekmede açılır</li>
            <li>✅ <strong>Otomatik arama yapar</strong> → Firma adı + şehir + ilçe</li>
            <li>✅ <strong>Firma Google'da kayıtlıysa</strong> → Direkt gösterir</li>
            <li>✅ <strong>Kayıtlı değilse</strong> → Yakındaki benzer yerleri gösterir</li>
          </ul>
        </div>

        {/* Ana Sayfaya Dön */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 rounded-2xl font-bold hover:from-yellow-500 hover:to-amber-500 transition-all shadow-lg hover:shadow-xl"
          >
            ← Ana Sayfaya Dön
          </a>
        </div>

      </div>
    </div>
  );
}
