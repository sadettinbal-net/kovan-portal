'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import KonumSecici from '@/components/KonumSecici';

export default function FirmaEklePage() {
  const [kullanici, setKullanici] = useState<any>(null);
  const [formData, setFormData] = useState({
    dukkan_adi: '',
    usta_adi: '',
    telefon: '',
    cep_telefonu: '',
    whatsapp: '',
    site_id: '',
    mahalle_id: '',
    sokak_id: '',
    blok_no: '',
    web_sitesi: '',
    alt_kategori_id: '',
  });
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [altKategoriler, setAltKategoriler] = useState<any[]>([]);
  const [seciliKategori, setSeciliKategori] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [basarili, setBasarili] = useState(false);
  const router = useRouter();

  // Kullanıcı kontrolü
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        router.push('/giris');
      } else {
        setKullanici(data.session.user);
      }
    });
  }, [router]);

  useEffect(() => {
    loadKategoriler();
  }, []);

  useEffect(() => {
    if (seciliKategori) {
      loadAltKategoriler(parseInt(seciliKategori));
    } else {
      setAltKategoriler([]);
    }
  }, [seciliKategori]);

  const loadKategoriler = async () => {
    const { data } = await supabase.from('kategoriler').select('*').order('id');
    if (data) setKategoriler(data);
  };

  const loadAltKategoriler = async (kategoriId: number) => {
    const { data } = await supabase
      .from('alt_kategoriler')
      .select('*')
      .eq('kategori_id', kategoriId)
      .order('id');
    if (data) setAltKategoriler(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.dukkan_adi) {
      setError('Firma adı zorunludur');
      setLoading(false);
      return;
    }

    if (!formData.mahalle_id && !formData.site_id) {
      setError('Lütfen konum bilgisi seçiniz (Sanayi sitesi veya mahalle)');
      setLoading(false);
      return;
    }

    if (!formData.alt_kategori_id) {
      setError('Lütfen kategori seçiniz');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/firma-talepleri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          kullanici_id: kullanici.id,
        }),
      });

      if (response.ok) {
        setBasarili(true);
        setFormData({
          dukkan_adi: '',
          usta_adi: '',
          telefon: '',
          cep_telefonu: '',
          whatsapp: '',
          site_id: '',
          mahalle_id: '',
          sokak_id: '',
          blok_no: '',
          web_sitesi: '',
          alt_kategori_id: '',
        });
        setSeciliKategori('');
      } else {
        const data = await response.json();
        setError(data.error || 'Bir hata oluştu');
      }
    } catch (err) {
      setError('Talebiniz gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (basarili) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Talebiniz Alındı!</h2>
          <p className="text-gray-600 mb-6">
            Firma ekleme talebiniz başarıyla oluşturuldu. Yönetici onayından sonra firmanız sisteme eklenecektir.
            En kısa sürede talebiniz değerlendirilecektir.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setBasarili(false);
                setFormData({
                  dukkan_adi: '',
                  usta_adi: '',
                  telefon: '',
                  cep_telefonu: '',
                  whatsapp: '',
                  site_id: '',
                  mahalle_id: '',
                  sokak_id: '',
                  blok_no: '',
                  web_sitesi: '',
                  alt_kategori_id: '',
                });
              }}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all"
            >
              Başka Firma Ekle
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-200/50">
          <div className="mb-8">
            <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Firma Ekle
            </h1>
            <p className="text-gray-600 mt-2">
              Firmanızın bilgilerini girin. Talebiniz yönetici onayından sonra sisteme eklenecektir.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Firma Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Firma Bilgileri</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firma Adı *
                </label>
                <input
                  type="text"
                  value={formData.dukkan_adi}
                  onChange={(e) => setFormData({ ...formData, dukkan_adi: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yetkili Adı
                </label>
                <input
                  type="text"
                  value={formData.usta_adi}
                  onChange={(e) => setFormData({ ...formData, usta_adi: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                    placeholder="0212 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cep Telefonu
                  </label>
                  <input
                    type="tel"
                    value={formData.cep_telefonu}
                    onChange={(e) => setFormData({ ...formData, cep_telefonu: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                    placeholder="0532 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                    placeholder="0532 123 45 67"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Web Sitesi
                </label>
                <input
                  type="url"
                  value={formData.web_sitesi}
                  onChange={(e) => setFormData({ ...formData, web_sitesi: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            {/* Kategori Seçimi */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Kategori *</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ana Kategori
                </label>
                <select
                  value={seciliKategori}
                  onChange={(e) => {
                    setSeciliKategori(e.target.value);
                    setFormData({ ...formData, alt_kategori_id: '' });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Kategori Seçiniz</option>
                  {kategoriler.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.kategori_adi}
                    </option>
                  ))}
                </select>
              </div>

              {altKategoriler.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alt Kategori
                  </label>
                  <select
                    value={formData.alt_kategori_id}
                    onChange={(e) => setFormData({ ...formData, alt_kategori_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Alt Kategori Seçiniz</option>
                    {altKategoriler.map((ak) => (
                      <option key={ak.id} value={ak.id}>
                        {ak.alt_kategori_adi}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Konum Bilgisi */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Konum Bilgisi *</h3>
              <KonumSecici
                onKonumSec={(konum) => {
                  setFormData({
                    ...formData,
                    site_id: konum.site_id || '',
                    mahalle_id: konum.mahalle_id || '',
                    sokak_id: konum.sokak_id || '',
                  });
                }}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blok/Kapı No
                </label>
                <input
                  type="text"
                  value={formData.blok_no}
                  onChange={(e) => setFormData({ ...formData, blok_no: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  placeholder="A Blok No: 12"
                />
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Gönderiliyor...' : 'Talep Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
