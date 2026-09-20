'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [aramaTipi, setAramaTipi] = useState<'sanayi' | 'mahalle' | ''>(''); // Yeni: Arama tipi seçimi
  const [secim, setSecim] = useState({ il: '', ilce: '', mahalle: '', sokak: '', site: '' });
  const [veriler, setVeriler] = useState({ iller: [], ilceler: [], mahalleler: [], sokaklar: [], siteler: [], dukkanlar: [], kategoriler: [], altKategoriler: [] });
  const [hata, setHata] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');
  const [seciliKategori, setSeciliKategori] = useState(0);
  const [seciliAltKategori, setSeciliAltKategori] = useState(0);
  const [istatistikler, setIstatistikler] = useState({ toplamSite: 0, toplamDukkan: 0, toplamKategori: 0 });

  useEffect(() => {
    async function ilkYukleme() {
      const { data, error } = await supabase.from('iller').select('*').order('sehir_adi');
      if (error) setHata("Bağlantı Hatası: " + error.message);
      else setVeriler(prev => ({ ...prev, iller: data || [] }));

      // Kategorileri yükle
      const { data: katData } = await supabase.from('kategoriler').select('*').order('id');
      const { data: altKatData } = await supabase.from('alt_kategoriler').select('*').order('id');

      setVeriler(prev => ({
        ...prev,
        kategoriler: katData || [],
        altKategoriler: altKatData || []
      }));

      // İstatistikleri yükle
      const { data: siteData } = await supabase.from('sanayi_siteleri').select('id');
      const { data: dukkanData } = await supabase.from('dukkanlar').select('id');

      setIstatistikler({
        toplamSite: siteData?.length || 0,
        toplamDukkan: dukkanData?.length || 0,
        toplamKategori: katData?.length || 0
      });
    }
    ilkYukleme();
  }, []);

  const ilSec = async (ilAdi: string) => {
    setSecim({ il: ilAdi, ilce: '', mahalle: '', sokak: '', site: '' });
    setAramaTipi(''); // Arama tipini sıfırla

    // İlçeleri mahalleler tablosundan alalım (unique ilce_adi)
    // Mahalleler tablosunda il_adi tamamı büyük harf (İSTANBUL, İZMİR, ANKARA)
    // İller tablosunda küçük harfle başlıyor (İstanbul, İzmir, Ankara)
    // Türkçe karakterler için toLocaleUpperCase('tr-TR') kullanıyoruz
    const ilAdiUpper = ilAdi.toLocaleUpperCase('tr-TR');

    const { data: mahallelerData } = await supabase
      .from('mahalleler')
      .select('ilce_adi')
      .eq('il_adi', ilAdiUpper);

    // Unique ilçe adlarını al
    const uniqueIlceler = [...new Set(mahallelerData?.map((m: any) => m.ilce_adi) || [])];
    const ilcelerArray = uniqueIlceler.map((ilce, idx) => ({ id: idx, ilce_adi: ilce })).sort((a, b) => a.ilce_adi.localeCompare(b.ilce_adi));

    setVeriler(prev => ({ ...prev, ilceler: ilcelerArray, mahalleler: [], sokaklar: [], siteler: [], dukkanlar: [] }));
  };

  const ilceSec = async (ilceAdi: string) => {
    setSecim(prev => ({ ...prev, ilce: ilceAdi, mahalle: '', sokak: '', site: '' }));
    setAramaTipi(''); // Arama tipini sıfırla

    // Her zaman mahalleleri yükle (konum seçimi için)
    const { data } = await supabase.from('mahalleler').select('*').eq('ilce_adi', ilceAdi).order('mahalle_adi');

    // Unique mahalle_id bazında filtrele (duplicate kayıtlar olabilir)
    const uniqueMahalleler = data ? Array.from(
      new Map(data.map(m => [m.mahalle_id, m])).values()
    ) : [];

    setVeriler(prev => ({ ...prev, mahalleler: uniqueMahalleler, sokaklar: [], siteler: [], dukkanlar: [] }));
  };

  const mahalleSec = async (mahalle_id: string) => {
    setSecim(prev => ({ ...prev, mahalle: mahalle_id, sokak: '', site: '' }));
    setAramaTipi(''); // Arama tipini sıfırla
    const { data } = await supabase.from('sokaklar').select('*').eq('mahalle_id', parseInt(mahalle_id)).order('sokak_adi');

    // Unique sokak_id bazında filtrele (duplicate kayıtlar olabilir)
    const uniqueSokaklar = data ? Array.from(
      new Map(data.map(s => [s.sokak_id, s])).values()
    ) : [];

    setVeriler(prev => ({ ...prev, sokaklar: uniqueSokaklar, siteler: [], dukkanlar: [] }));
  };

  const sokakSec = async (sokak_id: string) => {
    setSecim(prev => ({ ...prev, sokak: sokak_id, site: '' }));
    setAramaTipi(''); // Arama tipini sıfırla

    // Arama tipi seçilmeden sadece sokak seçimi yapılıyor
    // Dükkan göstermeyi aramaTipi seçimine bırak
    setVeriler(prev => ({ ...prev, dukkanlar: [] }));
  };

  const aramaTipiSec = async (tip: 'sanayi' | 'mahalle') => {
    setAramaTipi(tip);

    if (tip === 'sanayi') {
      // SANAYİ SİTESİ: İlçe seçiliyse o ilçenin, yoksa tüm ilin OSB'lerini yükle
      if (secim.il) {
        const ilAdiUpper = secim.il.toLocaleUpperCase('tr-TR');

        let query = supabase
          .from('sanayi_siteleri')
          .select('*')
          .eq('il_adi', ilAdiUpper);

        // Eğer ilçe de seçiliyse, ilçeye göre filtrele
        if (secim.ilce) {
          query = query.eq('ilce_adi', secim.ilce);
        }

        const { data: sitelerData } = await query.order('site_adi');

        setVeriler(prev => ({ ...prev, siteler: sitelerData || [] }));
      }
    } else {
      // MAHALLE İŞLETMESİ: Bu sokaktaki işletmeleri yükle
      if (secim.sokak) {
        const { data: sokakDukkanlar } = await supabase
          .from('dukkanlar')
          .select('*')
          .eq('sokak_id', parseInt(secim.sokak))
          .is('site_id', null);

        // Sokak işletmelerine kategori bilgisi ekle
        const dukkanlarWithKategoriler = await Promise.all(
          (sokakDukkanlar || []).map(async (dukkan) => {
            if (dukkan.alt_kategori_id) {
              const { data: altKat } = await supabase
                .from('alt_kategoriler')
                .select('id, alt_kategori_adi, kategori_id')
                .eq('id', dukkan.alt_kategori_id)
                .single();

              if (altKat) {
                const { data: anaKat } = await supabase
                  .from('kategoriler')
                  .select('id, kategori_adi, icon, renk')
                  .eq('id', altKat.kategori_id)
                  .single();

                return {
                  ...dukkan,
                  alt_kategoriler: {
                    ...altKat,
                    kategoriler: anaKat
                  }
                };
              }
            }
            return dukkan;
          })
        );

        setVeriler(prev => ({ ...prev, dukkanlar: dukkanlarWithKategoriler }));
      }
    }
  };

  const siteSec = async (id: string) => {
    setSecim(prev => ({ ...prev, site: id }));

    // Dükkanları çek
    const { data: dukkanlar } = await supabase
      .from('dukkanlar')
      .select('*')
      .eq('site_id', parseInt(id));

    // Her dükkan için kategori bilgisini ayrı çek (schema cache sorunu için)
    const dukkanlarWithKategoriler = await Promise.all(
      (dukkanlar || []).map(async (dukkan) => {
        if (dukkan.alt_kategori_id) {
          const { data: altKat } = await supabase
            .from('alt_kategoriler')
            .select('id, alt_kategori_adi, kategori_id')
            .eq('id', dukkan.alt_kategori_id)
            .single();

          if (altKat) {
            const { data: anaKat } = await supabase
              .from('kategoriler')
              .select('id, kategori_adi, icon, renk')
              .eq('id', altKat.kategori_id)
              .single();

            return {
              ...dukkan,
              alt_kategoriler: {
                ...altKat,
                kategoriler: anaKat
              }
            };
          }
        }
        return dukkan;
      })
    );

    setVeriler(prev => ({ ...prev, dukkanlar: dukkanlarWithKategoriler }));
    setAramaMetni('');
    setSeciliKategori(0);
    setSeciliAltKategori(0);
  };

  // Filtrelenmiş dükkanlar
  const filtreliDukkanlar = useMemo(() => {
    let sonuc = veriler.dukkanlar;

    // Arama filtresi
    if (aramaMetni) {
      sonuc = sonuc.filter((d: any) =>
        d.dukkan_adi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        d.usta_adi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        d.alt_kategoriler?.alt_kategori_adi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        d.alt_kategoriler?.kategoriler?.kategori_adi.toLowerCase().includes(aramaMetni.toLowerCase())
      );
    }

    // Ana kategori filtresi
    if (seciliKategori > 0) {
      sonuc = sonuc.filter((d: any) => d.alt_kategoriler?.kategori_id === seciliKategori);
    }

    // Alt kategori filtresi
    if (seciliAltKategori > 0) {
      sonuc = sonuc.filter((d: any) => d.alt_kategori_id === seciliAltKategori);
    }

    return sonuc;
  }, [veriler.dukkanlar, aramaMetni, seciliKategori, seciliAltKategori]);

  // Dükkanların sahip olduğu kategoriler
  const mevcutKategoriler = useMemo(() => {
    const kategoriIds = new Set(
      veriler.dukkanlar
        .filter((d: any) => d.alt_kategoriler?.kategoriler)
        .map((d: any) => d.alt_kategoriler.kategoriler.id)
    );
    return veriler.kategoriler.filter((k: any) => kategoriIds.has(k.id));
  }, [veriler.dukkanlar, veriler.kategoriler]);

  // Seçili kategoriye göre alt kategoriler
  const mevcutAltKategoriler = useMemo(() => {
    if (seciliKategori === 0) return [];

    const altKatIds = new Set(
      veriler.dukkanlar
        .filter((d: any) => d.alt_kategoriler?.kategori_id === seciliKategori)
        .map((d: any) => d.alt_kategori_id)
    );

    return veriler.altKategoriler.filter((ak: any) =>
      ak.kategori_id === seciliKategori && altKatIds.has(ak.id)
    );
  }, [veriler.dukkanlar, veriler.altKategoriler, seciliKategori]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-yellow-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo - Sol Üst */}
            <div className="flex items-center gap-2">
              <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Arı Gövdesi */}
                <ellipse cx="32" cy="36" rx="16" ry="20" fill="#FDB913"/>
                {/* Siyah Çizgiler */}
                <path d="M16 28 C16 28 48 28 48 28" stroke="#1F1F1F" strokeWidth="3" strokeLinecap="round"/>
                <path d="M16 36 C16 36 48 36 48 36" stroke="#1F1F1F" strokeWidth="3" strokeLinecap="round"/>
                <path d="M16 44 C16 44 48 44 48 44" stroke="#1F1F1F" strokeWidth="3" strokeLinecap="round"/>
                {/* Baş */}
                <circle cx="32" cy="18" r="8" fill="#1F1F1F"/>
                {/* Gözler */}
                <circle cx="28" cy="17" r="2" fill="white"/>
                <circle cx="36" cy="17" r="2" fill="white"/>
                {/* Anten */}
                <path d="M28 10 L25 5 M36 10 L39 5" stroke="#1F1F1F" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="25" cy="5" r="1.5" fill="#1F1F1F"/>
                <circle cx="39" cy="5" r="1.5" fill="#1F1F1F"/>
                {/* Sol Kanatlar */}
                <ellipse cx="20" cy="28" rx="12" ry="8" fill="white" opacity="0.7" transform="rotate(-30 20 28)"/>
                <ellipse cx="18" cy="32" rx="10" ry="6" fill="white" opacity="0.6" transform="rotate(-35 18 32)"/>
                {/* Sağ Kanatlar */}
                <ellipse cx="44" cy="28" rx="12" ry="8" fill="white" opacity="0.7" transform="rotate(30 44 28)"/>
                <ellipse cx="46" cy="32" rx="10" ry="6" fill="white" opacity="0.6" transform="rotate(35 46 32)"/>
                {/* Kanat Detayları */}
                <ellipse cx="20" cy="28" rx="12" ry="8" fill="none" stroke="#FDB913" strokeWidth="1" opacity="0.5" transform="rotate(-30 20 28)"/>
                <ellipse cx="44" cy="28" rx="12" ry="8" fill="none" stroke="#FDB913" strokeWidth="1" opacity="0.5" transform="rotate(30 44 28)"/>
                {/* İğne */}
                <path d="M32 52 L32 58" stroke="#1F1F1F" strokeWidth="2" strokeLinecap="round"/>
                <path d="M32 58 L30 56 L34 56 Z" fill="#1F1F1F"/>
              </svg>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-tight leading-none">
                  KOVAN PORTAL
                </h1>
                <p className="text-[10px] text-gray-600 font-medium">Türkiye'nin Sanayi Rehberi</p>
              </div>
            </div>

            {/* Navigation Menu - Sağ */}
            <div className="hidden md:flex items-center gap-1">
              <a href="#" className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                Anasayfa
              </a>
              <a href="#" className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                Firmalar
              </a>
              <a href="#" className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                Özel Firmalar
              </a>
              <a href="#" className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                Firma Ekle
              </a>
              <a href="#" className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                İletişim
              </a>
              <a href="#" className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                Site Kullanımı
              </a>
              <a href="#" className="px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 rounded-xl transition-all shadow-md">
                Üye Ol
              </a>

              {/* Dil Seçimi */}
              <button className="px-3 py-2 text-sm font-bold text-gray-700 hover:bg-yellow-50 rounded-xl transition-all flex items-center gap-1.5">
                <span className="text-lg">🇹🇷</span>
                <span>TR</span>
              </button>

              {/* Google ile Giriş */}
              <a href="#" className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-all flex items-center gap-2 border-2 border-gray-300">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google ile Giriş Yap</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-gray-700 hover:bg-yellow-50 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4">

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 p-3 rounded-2xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-xs font-bold text-yellow-900/70 uppercase tracking-wider mb-1">Sanayi Sitesi</div>
              <div className="text-3xl font-black text-white mb-0.5">{istatistikler.toplamSite}</div>
              <div className="text-[10px] text-yellow-900/60 font-medium">Kayıtlı Lokasyon</div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-3 rounded-2xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Toplam Dükkan</div>
              <div className="text-3xl font-black text-white mb-0.5">{istatistikler.toplamDukkan}</div>
              <div className="text-[10px] text-slate-400 font-medium">Aktif İşletme</div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Kategoriler</div>
              <div className="text-3xl font-black text-white mb-0.5">{istatistikler.toplamKategori}</div>
              <div className="text-[10px] text-blue-200 font-medium">Farklı Sektör</div>
            </div>
          </div>
        </div>

        {hata && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-2xl text-sm mb-6 animate-in fade-in slide-in-from-top-4 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="font-bold">Bağlantı Hatası</div>
                <div className="text-xs opacity-80">{hata}</div>
              </div>
            </div>
          </div>
        )}

        {/* Konum Seçim Paneli - HER ZAMAN GÖRÜNÜR */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">📍 Şehir Seçin</label>
              <select
                className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 font-bold text-gray-700 outline-none transition-all hover:border-yellow-400 focus:border-yellow-500 focus:shadow-lg appearance-none cursor-pointer"
                onChange={(e) => ilSec(e.target.value)}
                value={secim.il}
              >
                <option value="">Şehir Seç</option>
                {veriler.iller.map((il: any) => <option key={il.id} value={il.sehir_adi}>{il.sehir_adi}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">🗺️ İlçe Seçin</label>
              <select
                className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 font-bold text-gray-700 outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-yellow-400 focus:border-yellow-500 focus:shadow-lg appearance-none cursor-pointer"
                onChange={(e) => ilceSec(e.target.value)}
                disabled={!secim.il}
                value={secim.ilce}
              >
                <option value="">İlçe Seç</option>
                {veriler.ilceler.map((ilce: any) => <option key={ilce.id} value={ilce.ilce_adi}>{ilce.ilce_adi}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">🏘️ Mahalle Seçin</label>
              <select
                className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 font-bold text-gray-700 outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-yellow-400 focus:border-yellow-500 focus:shadow-lg appearance-none cursor-pointer"
                onChange={(e) => mahalleSec(e.target.value)}
                disabled={!secim.ilce}
                value={secim.mahalle}
              >
                <option value="">Mahalle Seç</option>
                {veriler.mahalleler.map((mahalle: any) => <option key={mahalle.mahalle_id} value={mahalle.mahalle_id}>{mahalle.mahalle_adi}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">🛣️ Sokak Seçin</label>
              <select
                className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 font-bold text-gray-700 outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:border-yellow-400 focus:border-yellow-500 focus:shadow-lg appearance-none cursor-pointer"
                onChange={(e) => sokakSec(e.target.value)}
                disabled={!secim.mahalle}
                value={secim.sokak}
              >
                <option value="">Sokak Seç</option>
                {veriler.sokaklar.map((sokak: any) => <option key={sokak.sokak_id} value={sokak.sokak_id}>{sokak.sokak_adi}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Ne Arıyorsunuz? - İl seçildikten sonra */}
        {secim.il && !aramaTipi && (
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 mb-2">Ne Arıyorsunuz?</h2>
              <p className="text-sm text-gray-600">Bu konumda hangi tür işletme arıyorsunuz?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => aramaTipiSec('sanayi')}
                className="group relative overflow-hidden p-8 rounded-3xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative text-center">
                  <div className="text-6xl mb-4">🏭</div>
                  <div className="text-2xl font-black text-gray-900 mb-2">Sanayi Sitesi</div>
                  <div className="text-sm text-gray-700 font-medium">Organize sanayi bölgelerindeki işletmeler</div>
                </div>
              </button>

              <button
                onClick={() => aramaTipiSec('mahalle')}
                className="group relative overflow-hidden p-8 rounded-3xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400"
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative text-center">
                  <div className="text-6xl mb-4">🏪</div>
                  <div className="text-2xl font-black text-white mb-2">Mahalle İşletmesi</div>
                  <div className="text-sm text-white font-medium">Eczane, market, kuaför, dişçi vb.</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Sanayi Sitesi Seçimi - Sanayi tipi seçildiğinde */}
        {aramaTipi === 'sanayi' && veriler.siteler.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">🏭 Sanayi Sitesi Seçin</label>
              <select
                className="w-full p-4 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-2xl border-2 border-yellow-500 font-black text-gray-900 outline-none transition-all hover:from-yellow-500 hover:to-amber-500 focus:shadow-xl appearance-none cursor-pointer"
                onChange={(e) => siteSec(e.target.value)}
                value={secim.site}
              >
                <option value="">Sanayi Sitesi Seç</option>
                {veriler.siteler.map((s: any) => <option key={s.id} value={s.id}>{s.site_adi}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Arama ve Filtreleme */}
        {veriler.dukkanlar.length > 0 && (
          <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Dükkan, usta veya kategori ara..."
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                className="w-full p-5 pl-12 bg-white rounded-2xl border-2 border-gray-200 font-medium text-gray-700 outline-none focus:border-yellow-400 focus:shadow-xl transition-all placeholder:text-gray-400"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</div>
            </div>

            {mevcutKategoriler.length > 0 && (
              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-gray-200/50">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ana Kategoriler</div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setSeciliKategori(0);
                        setSeciliAltKategori(0);
                      }}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        seciliKategori === 0
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Tümü
                    </button>
                    {mevcutKategoriler.map((kat: any) => (
                      <button
                        key={kat.id}
                        onClick={() => {
                          setSeciliKategori(kat.id);
                          setSeciliAltKategori(0);
                        }}
                        style={{
                          backgroundColor: seciliKategori === kat.id ? kat.renk : undefined,
                          borderColor: seciliKategori === kat.id ? kat.renk : undefined
                        }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                          seciliKategori === kat.id
                            ? 'text-white shadow-lg scale-105 border-2'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{kat.icon}</span>
                        <span>{kat.kategori_adi}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {mevcutAltKategoriler.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-gray-200/50">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Alt Kategoriler</div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setSeciliAltKategori(0)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          seciliAltKategori === 0
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Tümü
                      </button>
                      {mevcutAltKategoriler.map((altKat: any) => (
                        <button
                          key={altKat.id}
                          onClick={() => setSeciliAltKategori(altKat.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            seciliAltKategori === altKat.id
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {altKat.alt_kategori_adi}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-center bg-white/60 backdrop-blur-sm py-3 px-5 rounded-xl">
              <span className="text-sm font-bold text-gray-700">{filtreliDukkanlar.length}</span>
              <span className="text-sm text-gray-500 ml-1">dükkan bulundu</span>
            </div>
          </div>
        )}

        {/* DÜKKAN LİSTESİ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          {filtreliDukkanlar.length > 0 ? (
            filtreliDukkanlar.map((dukkan: any, index: number) => (
              <div
                key={dukkan.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="group bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg border-2 border-yellow-400/30 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-yellow-400 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-black text-gray-800 uppercase leading-tight">{dukkan.dukkan_adi}</h2>
                  <div className="flex flex-col gap-1.5 items-end">
                    {dukkan.alt_kategoriler?.kategoriler && (
                      <span
                        style={{ backgroundColor: dukkan.alt_kategoriler.kategoriler.renk }}
                        className="text-white text-xs px-3 py-1.5 rounded-xl font-black uppercase shadow-md whitespace-nowrap flex items-center gap-1.5"
                      >
                        <span>{dukkan.alt_kategoriler.kategoriler.icon}</span>
                        <span>{dukkan.alt_kategoriler.kategoriler.kategori_adi}</span>
                      </span>
                    )}
                    {dukkan.alt_kategoriler?.alt_kategori_adi && (
                      <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-lg font-bold whitespace-nowrap">
                        {dukkan.alt_kategoriler.alt_kategori_adi}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4 text-gray-600">
                  <span className="text-lg">👤</span>
                  <p className="font-bold text-sm">{dukkan.usta_adi}</p>
                </div>
                <a
                  href={`tel:${dukkan.telefon}`}
                  className="flex items-center justify-center w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 rounded-2xl font-bold gap-2 hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 group-hover:shadow-yellow-400/20"
                >
                  <span className="text-xl">📞</span>
                  <span>{dukkan.telefon}</span>
                </a>
              </div>
            ))
          ) : veriler.dukkanlar.length > 0 ? (
            <div className="col-span-full text-center p-12 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 animate-in fade-in">
              <div className="text-7xl mb-4">🔍</div>
              <div className="text-gray-700 font-bold text-lg mb-2">Arama kriterlerine uygun dükkan bulunamadı</div>
              <div className="text-gray-500 text-sm mb-6">Farklı bir arama terimi deneyin veya filtreleri temizleyin</div>
              <button
                onClick={() => {
                  setAramaMetni('');
                  setSeciliKategori(0);
                  setSeciliAltKategori(0);
                }}
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 rounded-2xl font-bold hover:from-yellow-500 hover:to-amber-500 transition-all shadow-lg hover:shadow-xl"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (secim.site || secim.sokak) && (
            <div className="col-span-full text-center p-12 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 animate-in fade-in">
              <div className="text-7xl mb-4">{aramaTipi === 'sanayi' ? '🏭' : '🏪'}</div>
              <div className="text-gray-700 font-bold text-lg mb-2">
                {aramaTipi === 'sanayi' ? 'Bu sitede henüz dükkan kaydı yok' : 'Bu sokakta henüz işletme kaydı yok'}
              </div>
              <div className="text-gray-500 text-sm">
                {aramaTipi === 'sanayi' ? 'Yakında bu sanayi sitesine dükkanlar eklenecektir' : 'Yakında bu sokağa işletmeler eklenecektir'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full text-xs text-gray-500 font-medium">
            <span>💼</span>
            <span>Kovan Portal © 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}