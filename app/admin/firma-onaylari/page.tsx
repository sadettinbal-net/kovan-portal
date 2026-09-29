'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface FirmaTalebi {
  id: number;
  dukkan_adi: string;
  usta_adi: string;
  telefon: string;
  cep_telefonu: string;
  whatsapp: string;
  web_sitesi: string;
  blok_no: string;
  hizmetler: string | null;
  kart_resmi: string | null;
  fotograflar: string[];
  durum: string;
  olusturulma_tarihi: string;
  kullanici_id: string;
  alt_kategoriler: {
    alt_kategori_adi: string;
    kategoriler: { kategori_adi: string };
  };
  sanayi_siteleri?: { site_adi: string };
  mahalleler?: { mahalle_adi: string };
  sokaklar?: { sokak_adi: string };
}

export default function FirmaOnaylariPage() {
  const router = useRouter();
  const [talepler, setTalepler] = useState<FirmaTalebi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtrelenenDurum, setFiltrelenenDurum] = useState('beklemede');
  const [seciliTalep, setSeciliTalep] = useState<FirmaTalebi | null>(null);
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [yoneticiNotu, setYoneticiNotu] = useState('');

  useEffect(() => {
    checkAuth();
    loadTalepler();
  }, [filtrelenenDurum]);

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

  const loadTalepler = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/firma-talepleri?durum=${filtrelenenDurum}`);
      if (response.ok) {
        const data = await response.json();
        setTalepler(data);
      } else {
        setError('Talepler yüklenemedi');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOnayla = async (talepId: number) => {
    if (!confirm('Bu firma talebini onaylamak istediğinizden emin misiniz? Firma sisteme eklenecektir.')) {
      return;
    }

    setIslemYapiliyor(true);
    try {
      const response = await fetch('/api/admin/firma-talepleri/onayla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ talep_id: talepId, yonetici_notu: yoneticiNotu }),
      });

      if (response.ok) {
        alert('Firma başarıyla onaylandı ve sisteme eklendi!');
        setSeciliTalep(null);
        setYoneticiNotu('');
        loadTalepler();
      } else {
        const data = await response.json();
        alert('Hata: ' + (data.error || 'Onaylama işlemi başarısız'));
      }
    } catch (err) {
      alert('Bir hata oluştu');
    } finally {
      setIslemYapiliyor(false);
    }
  };

  const handleReddet = async (talepId: number) => {
    const neden = prompt('Reddetme nedeni (kullanıcıya bildirilecek):');
    if (!neden) return;

    setIslemYapiliyor(true);
    try {
      const response = await fetch('/api/admin/firma-talepleri/reddet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ talep_id: talepId, yonetici_notu: neden }),
      });

      if (response.ok) {
        alert('Talep reddedildi');
        setSeciliTalep(null);
        setYoneticiNotu('');
        loadTalepler();
      } else {
        const data = await response.json();
        alert('Hata: ' + (data.error || 'Reddetme işlemi başarısız'));
      }
    } catch (err) {
      alert('Bir hata oluştu');
    } finally {
      setIslemYapiliyor(false);
    }
  };

  const formatTarih = (tarih: string) => {
    return new Date(tarih).toLocaleString('tr-TR');
  };

  const durumRengi = (durum: string) => {
    switch (durum) {
      case 'beklemede': return 'bg-yellow-100 text-yellow-800';
      case 'onaylandi': return 'bg-green-100 text-green-800';
      case 'reddedildi': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">🏢 Firma Onayları</h1>
            <button
              onClick={() => router.push('/admin/yonetici')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              ← Yönetici Paneli
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            {['beklemede', 'onaylandi', 'reddedildi'].map((durum) => (
              <button
                key={durum}
                onClick={() => setFiltrelenenDurum(durum)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filtrelenenDurum === durum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {durum === 'beklemede' && '⏳ Bekleyen'}
                {durum === 'onaylandi' && '✅ Onaylanan'}
                {durum === 'reddedildi' && '❌ Reddedilen'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-500">Yükleniyor...</div>
          </div>
        ) : talepler.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-500">Bu durumda talep bulunamadı</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {talepler.map((talep) => (
              <div key={talep.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{talep.dukkan_adi}</h3>
                    <p className="text-sm text-gray-600">
                      {talep.alt_kategoriler?.kategoriler?.kategori_adi} • {talep.alt_kategoriler?.alt_kategori_adi}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${durumRengi(talep.durum)}`}>
                    {talep.durum === 'beklemede' && 'Beklemede'}
                    {talep.durum === 'onaylandi' && 'Onaylandı'}
                    {talep.durum === 'reddedildi' && 'Reddedildi'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                  {talep.usta_adi && (
                    <div>
                      <span className="text-gray-600">Yetkili:</span>
                      <span className="ml-2 font-medium">{talep.usta_adi}</span>
                    </div>
                  )}
                  {talep.telefon && (
                    <div>
                      <span className="text-gray-600">Telefon:</span>
                      <span className="ml-2 font-medium">{talep.telefon}</span>
                    </div>
                  )}
                  {talep.cep_telefonu && (
                    <div>
                      <span className="text-gray-600">Cep:</span>
                      <span className="ml-2 font-medium">{talep.cep_telefonu}</span>
                    </div>
                  )}
                  {talep.whatsapp && (
                    <div>
                      <span className="text-gray-600">WhatsApp:</span>
                      <span className="ml-2 font-medium">{talep.whatsapp}</span>
                    </div>
                  )}
                  {talep.web_sitesi && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Web:</span>
                      <a href={talep.web_sitesi} target="_blank" rel="noopener noreferrer" className="ml-2 font-medium text-blue-600 hover:underline">
                        {talep.web_sitesi}
                      </a>
                    </div>
                  )}
                </div>

                <div className="text-sm mb-4">
                  <span className="text-gray-600">Konum:</span>
                  <span className="ml-2 font-medium">
                    {talep.sanayi_siteleri?.site_adi || ''}
                    {talep.mahalleler?.mahalle_adi || ''}
                    {talep.sokaklar?.sokak_adi ? ` • ${talep.sokaklar.sokak_adi}` : ''}
                    {talep.blok_no ? ` • ${talep.blok_no}` : ''}
                  </span>
                </div>

                {talep.hizmetler && (
                  <div className="text-sm mb-4">
                    <span className="text-gray-600">Hizmetler:</span>
                    <span className="ml-2 font-medium">{talep.hizmetler}</span>
                  </div>
                )}

                {(talep.kart_resmi || talep.fotograflar?.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {talep.kart_resmi && (
                      <a href={talep.kart_resmi} target="_blank" rel="noopener noreferrer" className="relative">
                        <img src={talep.kart_resmi} alt="Kart resmi" className="w-24 h-20 object-cover rounded-lg border border-gray-200" />
                        <span className="absolute bottom-1 left-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 rounded">KART</span>
                      </a>
                    )}
                    {talep.fotograflar?.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="Detay fotoğrafı" className="w-24 h-20 object-cover rounded-lg border border-gray-200" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  Talep Tarihi: {formatTarih(talep.olusturulma_tarihi)}
                </div>

                {talep.durum === 'beklemede' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleOnayla(talep.id)}
                      disabled={islemYapiliyor}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      ✅ Onayla ve Sisteme Ekle
                    </button>
                    <button
                      onClick={() => handleReddet(talep.id)}
                      disabled={islemYapiliyor}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      ❌ Reddet
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
