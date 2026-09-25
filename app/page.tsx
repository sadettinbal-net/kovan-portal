'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import TurkiyeHaritasi from '@/components/TurkiyeHaritasi';

export default function Home() {
  const [aramaTipi, setAramaTipi] = useState<'sanayi' | 'mahalle' | ''>(''); // Yeni: Arama tipi seçimi
  const [secim, setSecim] = useState({ il: '', ilce: '', mahalle: '', sokak: '', site: '' });
  const [veriler, setVeriler] = useState({ iller: [], ilceler: [], mahalleler: [], sokaklar: [], siteler: [], dukkanlar: [], kategoriler: [], altKategoriler: [] });
  const [hata, setHata] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');
  const [seciliKategori, setSeciliKategori] = useState(0);
  const [seciliAltKategori, setSeciliAltKategori] = useState(0);
  const [istatistikler, setIstatistikler] = useState({ toplamSite: 0, toplamDukkan: 0, toplamKategori: 0 });

  // Modal state'leri
  const [modalAcik, setModalAcik] = useState<'siteler' | 'dukkanlar' | 'kategoriler' | null>(null);
  const [modalVeriler, setModalVeriler] = useState<any[]>([]);
  const [modalAramaMetni, setModalAramaMetni] = useState('');

  // Alt kategori modal state'leri
  const [altKategoriModalAcik, setAltKategoriModalAcik] = useState(false);
  const [seciliKategoriDetay, setSeciliKategoriDetay] = useState<any>(null);
  const [altKategoriListesi, setAltKategoriListesi] = useState<any[]>([]);

  // Firmalar modal state'leri
  const [firmalarModalAcik, setFirmalarModalAcik] = useState(false);
  const [seciliAltKategoriDetay, setSeciliAltKategoriDetay] = useState<any>(null);
  const [firmaListesi, setFirmaListesi] = useState<any[]>([]);

  // Sokak arama ve pagination state'leri
  const [sokakAramaMetni, setSokakAramaMetni] = useState('');
  const [sokakSayfasi, setSokakSayfasi] = useState(1);
  const [toplamSokakSayisi, setToplamSokakSayisi] = useState(0);
  const sokakSayfaBasinaMiktar = 50; // Her sayfada 50 sokak göster

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

    // İller tablosundan il_id bul
    const { data: ilData } = await supabase
      .from('iller')
      .select('id')
      .eq('sehir_adi', ilAdi)
      .single();

    if (!ilData) {
      console.log('İl bulunamadı:', ilAdi);
      setVeriler(prev => ({ ...prev, ilceler: [], mahalleler: [], sokaklar: [], siteler: [], dukkanlar: [] }));
      return;
    }

    // İLÇELER tablosundan ilçeleri çek (kolon adı sehir_id)
    const { data: ilcelerData, error } = await supabase
      .from('ilceler')
      .select('id, ilce_adi')
      .eq('sehir_id', ilData.id)
      .order('ilce_adi');

    console.log('İl seçildi:', ilAdi, 'ID:', ilData.id, 'İlçe sayısı:', ilcelerData?.length, 'error:', error);

    setVeriler(prev => ({ ...prev, ilceler: ilcelerData || [], mahalleler: [], sokaklar: [], siteler: [], dukkanlar: [] }));
  };

  const ilceSec = async (ilceAdi: string) => {
    setSecim(prev => ({ ...prev, ilce: ilceAdi, mahalle: '', sokak: '', site: '' }));
    setAramaTipi(''); // Arama tipini sıfırla

    // İl ID'sini bul
    const { data: ilData } = await supabase
      .from('iller')
      .select('id')
      .eq('sehir_adi', secim.il)
      .single();

    if (!ilData) {
      setVeriler(prev => ({ ...prev, mahalleler: [], sokaklar: [], siteler: [], dukkanlar: [] }));
      return;
    }

    // İlçe ID'sini bul (case-insensitive)
    const { data: ilceData } = await supabase
      .from('ilceler')
      .select('id')
      .eq('sehir_id', ilData.id)
      .ilike('ilce_adi', ilceAdi)
      .single();

    if (!ilceData) {
      setVeriler(prev => ({ ...prev, mahalleler: [], sokaklar: [], siteler: [], dukkanlar: [] }));
      return;
    }

    // MAHALLELER_YENI tablosundan mahalleleri çek
    const { data: mahalleData, error } = await supabase
      .from('mahalleler_yeni')
      .select('mahalle_id, mahalle_adi')
      .eq('ilce_id', ilceData.id)
      .order('mahalle_adi');

    console.log('Mahalle sorgusu - data:', mahalleData?.length, 'error:', error);

    setVeriler(prev => ({ ...prev, mahalleler: mahalleData || [], sokaklar: [], siteler: [], dukkanlar: [] }));
  };

  const mahalleSec = async (mahalle_id: string) => {
    setSecim(prev => ({ ...prev, mahalle: mahalle_id, sokak: '', site: '' }));
    setAramaTipi(''); // Arama tipini sıfırla
    setSokakAramaMetni(''); // Sokak arama metnini sıfırla
    setSokakSayfasi(1); // Sayfa numarasını sıfırla

    // İlk olarak toplam unique sokak sayısını al
    const { data: sokakData } = await supabase
      .from('sokaklar')
      .select('sokak_id')
      .eq('mahalle_id', parseInt(mahalle_id));

    const uniqueSokakIds = new Set(sokakData?.map((s: any) => s.sokak_id));
    setToplamSokakSayisi(uniqueSokakIds.size);

    // İlk 50 sokağı yükle
    await sokakYukle(parseInt(mahalle_id), '', 1);
  };

  // Sokak yükleme fonksiyonu (pagination ve arama ile)
  const sokakYukle = async (mahalle_id: number, aramaMetni: string, sayfa: number) => {
    let query = supabase
      .from('sokaklar')
      .select('*')
      .eq('mahalle_id', mahalle_id);

    // Arama filtresi
    if (aramaMetni) {
      query = query.ilike('sokak_adi', `%${aramaMetni}%`);
    }

    // Pagination (offset ve limit)
    const baslangic = (sayfa - 1) * sokakSayfaBasinaMiktar;
    query = query
      .order('sokak_adi')
      .range(baslangic, baslangic + sokakSayfaBasinaMiktar - 1);

    const { data } = await query;

    // Unique sokak_id bazında filtrele (duplicate kayıtlar olabilir)
    const uniqueSokaklar = data ? Array.from(
      new Map(data.map(s => [s.sokak_id, s])).values()
    ) : [];

    setVeriler(prev => ({ ...prev, sokaklar: uniqueSokaklar, siteler: [], dukkanlar: [] }));

    // Arama yapıldıysa toplam sayıyı güncelle
    if (aramaMetni) {
      const { count } = await supabase
        .from('sokaklar')
        .select('*', { count: 'exact', head: true })
        .eq('mahalle_id', mahalle_id)
        .ilike('sokak_adi', `%${aramaMetni}%`);

      setToplamSokakSayisi(count || 0);
    }
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

  // Modal açma fonksiyonları
  const siteleriGoster = async () => {
    const { data } = await supabase.from('sanayi_siteleri').select('*').order('site_adi');
    setModalVeriler(data || []);
    setModalAcik('siteler');
  };

  const dukkanlariGoster = async () => {
    const { data: dukkanlar, error } = await supabase.from('dukkanlar').select('*').order('dukkan_adi');

    console.log('Dükkanlar sorgusu:', { dukkanlar, error, count: dukkanlar?.length });

    // Her dükkan için kategori bilgisini manuel olarak çek
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
              .select('id, kategori_adi')
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

    console.log('Kategori eklenmiş dükkanlar:', dukkanlarWithKategoriler.length);
    setModalVeriler(dukkanlarWithKategoriler);
    setModalAcik('dukkanlar');
  };

  const kategorileriGoster = async () => {
    const { data } = await supabase.from('kategoriler').select('*').order('kategori_adi');
    setModalVeriler(data || []);
    setModalAcik('kategoriler');
  };

  const modalKapat = () => {
    setModalAcik(null);
    setModalVeriler([]);
    setModalAramaMetni('');
  };

  // Sokak arama ve pagination için debounced effect
  useEffect(() => {
    if (!secim.mahalle) return;

    const timer = setTimeout(() => {
      sokakYukle(parseInt(secim.mahalle), sokakAramaMetni, sokakSayfasi);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [sokakAramaMetni, sokakSayfasi]);

  // Toplam sayfa sayısı
  const toplamSokakSayfasi = Math.ceil(toplamSokakSayisi / sokakSayfaBasinaMiktar);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-yellow-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo - Sol Üst */}
            <div className="flex items-center gap-3">
              <svg className="w-12 h-12" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Kanatlar - Arka Plan */}
                <g opacity="0.85" className="animate-pulse">
                  <path d="M45 25 Q35 15 25 20 Q15 25 18 35 Q20 42 30 40 Q38 38 45 35 Z" fill="white" stroke="#E0E0E0" strokeWidth="1"/>
                  <path d="M48 25 Q38 12 28 16 Q20 20 23 30 Q25 36 33 34 Z" fill="white" stroke="#D0D0D0" strokeWidth="0.8" opacity="0.7"/>
                  <path d="M45 48 Q35 58 25 53 Q15 48 18 38 Q20 31 30 33 Q38 35 45 38 Z" fill="white" stroke="#E0E0E0" strokeWidth="1"/>
                  <path d="M48 48 Q38 61 28 57 Q20 53 23 43 Q25 37 33 39 Z" fill="white" stroke="#D0D0D0" strokeWidth="0.8" opacity="0.7"/>
                </g>

                {/* Göğüs (Thorax) - Tüylü Görünüm */}
                <ellipse cx="52" cy="36" rx="10" ry="11" fill="#2C2416"/>
                <ellipse cx="52" cy="36" rx="9" ry="10" fill="#3D321F"/>
                <circle cx="49" cy="33" r="1.5" fill="#5C4A2F" opacity="0.6"/>
                <circle cx="54" cy="35" r="1.2" fill="#5C4A2F" opacity="0.5"/>
                <circle cx="51" cy="39" r="1.3" fill="#5C4A2F" opacity="0.5"/>

                {/* Karın (Abdomen) - Sarı-Siyah Çizgili */}
                <ellipse cx="67" cy="36" rx="18" ry="13" fill="#FDB913"/>
                <ellipse cx="67" cy="36" rx="17" ry="12" fill="url(#beeStripes)"/>

                <defs>
                  <pattern id="beeStripes" x="0" y="0" width="8" height="100%" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="4" height="100%" fill="#2C2416"/>
                    <rect x="4" y="0" width="4" height="100%" fill="transparent"/>
                  </pattern>
                  <radialGradient id="headGradient">
                    <stop offset="0%" stopColor="#3D321F"/>
                    <stop offset="100%" stopColor="#2C2416"/>
                  </radialGradient>
                </defs>

                {/* Baş - Sağa Dönük */}
                <ellipse cx="42" cy="36" rx="7" ry="8" fill="url(#headGradient)"/>

                {/* Gözler - Bileşik Göz Yapısı */}
                <ellipse cx="40" cy="33" rx="3" ry="4" fill="#1a1a1a"/>
                <ellipse cx="40" cy="33" rx="2.5" ry="3.5" fill="#2d2d2d"/>
                <g opacity="0.3">
                  <circle cx="39.5" cy="32" r="0.4" fill="white"/>
                  <circle cx="40.5" cy="32.5" r="0.4" fill="white"/>
                  <circle cx="39.5" cy="33.5" r="0.4" fill="white"/>
                  <circle cx="40.5" cy="34" r="0.4" fill="white"/>
                </g>
                <circle cx="39" cy="31.5" r="0.8" fill="white" opacity="0.4"/>

                {/* Antenler */}
                <path d="M40 28 Q36 24 34 22" stroke="#2C2416" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M42 28 Q38 23 36 20" stroke="#2C2416" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="34" cy="22" r="1.2" fill="#3D321F"/>
                <circle cx="36" cy="20" r="1.2" fill="#3D321F"/>

                {/* Bacaklar */}
                <path d="M50 44 Q48 50 46 52" stroke="#2C2416" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M54 45 Q53 52 52 55" stroke="#2C2416" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M58 44 Q58 51 58 54" stroke="#2C2416" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M50 28 Q48 22 46 20" stroke="#2C2416" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M54 27 Q53 20 52 17" stroke="#2C2416" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M58 28 Q58 21 58 18" stroke="#2C2416" strokeWidth="1.8" strokeLinecap="round"/>

                {/* Parlama Efekti */}
                <ellipse cx="70" cy="32" rx="3" ry="2" fill="white" opacity="0.3"/>
                <ellipse cx="75" cy="35" rx="2" ry="1.5" fill="white" opacity="0.25"/>
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
          <button onClick={siteleriGoster} className="group relative overflow-hidden bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 p-3 rounded-2xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl cursor-pointer text-left">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-xs font-bold text-yellow-900/70 uppercase tracking-wider mb-1">Sanayi Sitesi</div>
              <div className="text-3xl font-black text-white mb-0.5">{istatistikler.toplamSite}</div>
              <div className="text-[10px] text-yellow-900/60 font-medium">Kayıtlı Lokasyon • Tıklayın</div>
            </div>
          </button>

          <button onClick={dukkanlariGoster} className="group relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-3 rounded-2xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl cursor-pointer text-left">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Toplam Dükkan</div>
              <div className="text-3xl font-black text-white mb-0.5">{istatistikler.toplamDukkan}</div>
              <div className="text-[10px] text-slate-400 font-medium">Aktif İşletme • Tıklayın</div>
            </div>
          </button>

          <button onClick={kategorileriGoster} className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl cursor-pointer text-left">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Kategoriler</div>
              <div className="text-3xl font-black text-white mb-0.5">{istatistikler.toplamKategori}</div>
              <div className="text-[10px] text-blue-200 font-medium">Farklı Sektör • Tıklayın</div>
            </div>
          </button>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📍 Şehir Seçin {veriler.iller.length > 0 && <span className="text-xs text-gray-500">({veriler.iller.length} il)</span>}
              </label>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🗺️ İlçe Seçin {veriler.ilceler.length > 0 && <span className="text-xs text-gray-500">({veriler.ilceler.length} ilçe)</span>}
              </label>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🏘️ Mahalle Seçin {veriler.mahalleler.length > 0 && <span className="text-xs text-gray-500">({veriler.mahalleler.length} mahalle)</span>}
              </label>
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

            {/* Sokak Seçimi - Arama ve Pagination ile */}
            {secim.mahalle && (
              <div className="relative space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200/50">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🛣️ Sokak Seçin {toplamSokakSayisi > 0 && <span className="text-xs text-gray-500">({toplamSokakSayisi} sokak)</span>}
                </label>

                {/* Arama Kutusu */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Sokak adı ara..."
                    value={sokakAramaMetni}
                    onChange={(e) => {
                      setSokakAramaMetni(e.target.value);
                      setSokakSayfasi(1); // Arama yapınca ilk sayfaya dön
                    }}
                    className="w-full p-4 pl-12 bg-white rounded-2xl border-2 border-gray-200 font-medium text-gray-700 outline-none focus:border-blue-400 focus:shadow-lg transition-all placeholder:text-gray-400"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</div>
                  {sokakAramaMetni && (
                    <button
                      onClick={() => {
                        setSokakAramaMetni('');
                        setSokakSayfasi(1);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sokak Listesi */}
                {veriler.sokaklar.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {veriler.sokaklar.map((sokak: any) => (
                      <button
                        key={sokak.sokak_id}
                        onClick={() => sokakSec(sokak.sokak_id.toString())}
                        className={`w-full text-left p-4 rounded-xl transition-all font-bold ${
                          secim.sokak === sokak.sokak_id.toString()
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-[1.02]'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md'
                        }`}
                      >
                        {sokak.sokak_adi}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 font-medium">
                    {sokakAramaMetni ? (
                      <>
                        <div className="text-4xl mb-2">🔍</div>
                        <div>"{sokakAramaMetni}" için sonuç bulunamadı</div>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">🛣️</div>
                        <div>Bu mahallede sokak kaydı bulunamadı</div>
                      </>
                    )}
                  </div>
                )}

                {/* Pagination Kontrolleri */}
                {toplamSokakSayfasi > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t-2 border-blue-200/50">
                    <button
                      onClick={() => setSokakSayfasi(prev => Math.max(1, prev - 1))}
                      disabled={sokakSayfasi === 1}
                      className="px-4 py-2 bg-white rounded-xl font-bold text-gray-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      ← Önceki
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-600">
                        Sayfa {sokakSayfasi} / {toplamSokakSayfasi}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({toplamSokakSayisi} sokak)
                      </span>
                    </div>

                    <button
                      onClick={() => setSokakSayfasi(prev => Math.min(toplamSokakSayfasi, prev + 1))}
                      disabled={sokakSayfasi === toplamSokakSayfasi}
                      className="px-4 py-2 bg-white rounded-xl font-bold text-gray-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      Sonraki →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Türkiye Haritası - Gizli (sadece görsel kaldırıldı) */}
        <div style={{ display: 'none' }}>
          <TurkiyeHaritasi
            onIlClick={(ilAdi) => ilSec(ilAdi)}
            seciliIl={secim.il}
            onMahalleClick={async (ilAdi, ilceAdi, mahalleId, mahalleAdi) => {
              console.log('Mahalle haritadan seçildi:', { ilAdi, ilceAdi, mahalleId, mahalleAdi });

              // Seçimi güncelle
              setSecim({
                il: ilAdi,
                ilce: ilceAdi,
                mahalle: mahalleId.toString(),
                sokak: '',
                site: ''
              });

              // Mahalle işletmelerini yükle
              const { data: mahalleIsletmeler } = await supabase
                .from('dukkanlar')
                .select('*')
                .eq('mahalle_id', mahalleId)
                .is('site_id', null);

              // İşletmelere kategori bilgisi ekle
              const dukkanlarWithKategoriler = await Promise.all(
                (mahalleIsletmeler || []).map(async (dukkan) => {
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
              setAramaTipi('mahalle'); // Mahalle işletmesi gösterildiğini belirt
            }}
          />
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
        <div id="firmalar-listesi" className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
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

        {/* Alt Kategoriler Modalı */}
        {altKategoriModalAcik && seciliKategoriDetay && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setAltKategoriModalAcik(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div
                className="p-4 flex items-center justify-between"
                style={{ backgroundColor: seciliKategoriDetay.renk || '#3B82F6' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{seciliKategoriDetay.icon || '📦'}</span>
                  <div>
                    <h2 className="text-xl font-black text-white">{seciliKategoriDetay.kategori_adi}</h2>
                    <p className="text-sm text-white/80">Alt Kategoriler ({altKategoriListesi.length})</p>
                  </div>
                </div>
                <button onClick={() => setAltKategoriModalAcik(false)} className="text-white hover:bg-white/20 rounded-full p-2 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-180px)]">
                {altKategoriListesi.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <div className="text-gray-700 font-bold text-lg mb-2">Henüz alt kategori yok</div>
                    <div className="text-gray-500 text-sm">Bu kategoriye alt kategori ekleyebilirsiniz</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {altKategoriListesi.map((altKat: any) => (
                      <button
                        key={altKat.id}
                        onClick={async () => {
                          // Alt kategoriye tıklandığında o alt kategorideki firmaları göster
                          const { data: dukkanlar } = await supabase
                            .from('dukkanlar')
                            .select('*')
                            .eq('alt_kategori_id', altKat.id);

                          // Her dükkan için kategori bilgisini ekle
                          const dukkanlarWithKategoriler = await Promise.all(
                            (dukkanlar || []).map(async (dukkan) => {
                              const { data: altKategori } = await supabase
                                .from('alt_kategoriler')
                                .select('id, alt_kategori_adi, kategori_id')
                                .eq('id', dukkan.alt_kategori_id)
                                .single();

                              if (altKategori) {
                                const { data: anaKategori } = await supabase
                                  .from('kategoriler')
                                  .select('id, kategori_adi, icon, renk')
                                  .eq('id', altKategori.kategori_id)
                                  .single();

                                return {
                                  ...dukkan,
                                  alt_kategoriler: {
                                    ...altKategori,
                                    kategoriler: anaKategori
                                  }
                                };
                              }
                              return dukkan;
                            })
                          );

                          // Firmaları göster
                          setVeriler(prev => ({ ...prev, dukkanlar: dukkanlarWithKategoriler }));

                          // Modalleri kapat
                          setAltKategoriModalAcik(false);
                          modalKapat();

                          // Arama ve filtreleri sıfırla
                          setAramaMetni('');
                          setSeciliKategori(0);
                          setSeciliAltKategori(0);
                        }}
                        className="w-full bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all hover:border-blue-400 hover:from-blue-50 hover:to-blue-100 cursor-pointer text-left"
                      >
                        <div className="font-bold text-gray-800 mb-1">{altKat.alt_kategori_adi}</div>
                        <div className="text-xs text-gray-500">Firmaları görmek için tıklayın</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
                <button
                  onClick={() => {
                    // Alt kategori ekleme işlemi
                    alert('Alt kategori ekleme özelliği yakında eklenecek!');
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all text-sm flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Alt Kategori Ekle</span>
                </button>
                <button
                  onClick={() => setAltKategoriModalAcik(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg transition-all text-sm"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {modalAcik && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={modalKapat}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-white">
                  {modalAcik === 'siteler' && '🏭 Sanayi Siteleri'}
                  {modalAcik === 'dukkanlar' && '🏪 Tüm Dükkanlar'}
                  {modalAcik === 'kategoriler' && '📂 Kategoriler'}
                </h2>
                <button onClick={modalKapat} className="text-white hover:bg-white/20 rounded-full p-2 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(70vh-120px)]">
                {modalAcik === 'siteler' && (
                  <div className="space-y-3">
                    {/* Arama Kutusu */}
                    <div className="sticky top-0 bg-white z-10 pb-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Sanayi sitesi ara..."
                          value={modalAramaMetni}
                          onChange={(e) => setModalAramaMetni(e.target.value)}
                          className="w-full p-3 pl-10 bg-gray-50 rounded-xl border-2 border-gray-200 font-medium text-gray-700 outline-none focus:border-yellow-400 focus:shadow-lg transition-all placeholder:text-gray-400"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">🔍</div>
                        {modalAramaMetni && (
                          <button
                            onClick={() => setModalAramaMetni('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-lg"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {modalVeriler.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">Henüz sanayi sitesi kaydı yok</div>
                    ) : (() => {
                      const filtreliSiteler = modalVeriler.filter((site: any) => {
                        if (!modalAramaMetni) return true;
                        const aramaKelime = modalAramaMetni.toLowerCase();
                        return (
                          site.site_adi?.toLowerCase().includes(aramaKelime) ||
                          site.il_adi?.toLowerCase().includes(aramaKelime) ||
                          site.ilce_adi?.toLowerCase().includes(aramaKelime) ||
                          site.adres?.toLowerCase().includes(aramaKelime)
                        );
                      });

                      if (filtreliSiteler.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-2">🔍</div>
                            <div className="text-gray-700 font-bold mb-1">Sonuç bulunamadı</div>
                            <div className="text-gray-500 text-sm">"{modalAramaMetni}" için sanayi sitesi bulunamadı</div>
                          </div>
                        );
                      }

                      return filtreliSiteler.map((site: any, index) => (
                        <button
                          key={site.id}
                          onClick={async () => {
                            // Site tıklandığında o siteye ait firmaları göster
                            await siteSec(site.id.toString());
                            modalKapat();
                          }}
                          className="w-full bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border-l-4 border-yellow-500 hover:shadow-md hover:from-yellow-100 hover:to-amber-100 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">#{index + 1}</span>
                                <h3 className="font-bold text-gray-800">{site.site_adi}</h3>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span>📍</span>
                                  <span>{site.il_adi} / {site.ilce_adi}</span>
                                </div>
                                {site.adres && (
                                  <div className="flex items-center gap-2">
                                    <span>🗺️</span>
                                    <span>{site.adres}</span>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-yellow-700 font-semibold">
                                👉 Firmaları görmek için tıklayın
                              </div>
                            </div>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                )}

                {modalAcik === 'dukkanlar' && (
                  <div className="space-y-2">
                    {modalVeriler.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">Henüz dükkan kaydı yok</div>
                    ) : (
                      modalVeriler.map((dukkan: any, index) => (
                        <div key={dukkan.id} className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg border-l-4 border-slate-700 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded-full">#{index + 1}</span>
                                <h3 className="font-bold text-gray-800">{dukkan.dukkan_adi}</h3>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                {dukkan.usta_adi && (
                                  <div className="flex items-center gap-2">
                                    <span>👤</span>
                                    <span className="font-medium">{dukkan.usta_adi}</span>
                                  </div>
                                )}
                                {dukkan.alt_kategoriler && (
                                  <div className="flex items-center gap-2">
                                    <span>📂</span>
                                    <span className="font-semibold">{dukkan.alt_kategoriler.kategoriler?.kategori_adi}</span>
                                    <span className="text-gray-400">→</span>
                                    <span>{dukkan.alt_kategoriler.alt_kategori_adi}</span>
                                  </div>
                                )}
                                {dukkan.telefon && (
                                  <div className="flex items-center gap-2">
                                    <span>📞</span>
                                    <span>{dukkan.telefon}</span>
                                  </div>
                                )}
                                {dukkan.web_sitesi && (
                                  <div className="flex items-center gap-2">
                                    <span>🌐</span>
                                    <a href={dukkan.web_sitesi} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{dukkan.web_sitesi}</a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {modalAcik === 'kategoriler' && (
                  <div className="space-y-3">
                    {/* Arama Kutusu */}
                    <div className="sticky top-0 bg-white z-10 pb-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Kategori veya alt kategori ara..."
                          value={modalAramaMetni}
                          onChange={(e) => setModalAramaMetni(e.target.value)}
                          className="w-full p-3 pl-10 bg-gray-50 rounded-xl border-2 border-gray-200 font-medium text-gray-700 outline-none focus:border-blue-400 focus:shadow-lg transition-all placeholder:text-gray-400"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">🔍</div>
                        {modalAramaMetni && (
                          <button
                            onClick={() => setModalAramaMetni('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-lg"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {modalVeriler.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">Henüz kategori kaydı yok</div>
                    ) : (() => {
                      // Eğer arama yapılıyorsa, önce alt kategorilerde ara
                      if (modalAramaMetni) {
                        const aramaKelime = modalAramaMetni.toLowerCase();

                        // Alt kategorilerde direkt arama yap
                        const eslesenAltKategoriler = veriler.altKategoriler.filter((ak: any) =>
                          ak.alt_kategori_adi?.toLowerCase().includes(aramaKelime)
                        );

                        // Eğer alt kategori eşleşmesi varsa, direkt alt kategorileri göster
                        if (eslesenAltKategoriler.length > 0) {
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-gray-600 font-medium mb-3">
                                {eslesenAltKategoriler.length} alt kategori bulundu
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {eslesenAltKategoriler.map((altKat: any) => {
                                  const anaKategori = modalVeriler.find((k: any) => k.id === altKat.kategori_id);
                                  return (
                                    <button
                                      key={altKat.id}
                                      onClick={async () => {
                                        // Alt kategoriye tıklandığında firmaları yükle ve modal aç
                                        const { data: dukkanlar } = await supabase
                                          .from('dukkanlar')
                                          .select('*')
                                          .eq('alt_kategori_id', altKat.id);

                                        // Her dükkan için kategori bilgisini ekle
                                        const dukkanlarWithKategoriler = await Promise.all(
                                          (dukkanlar || []).map(async (dukkan) => {
                                            const { data: altKategori } = await supabase
                                              .from('alt_kategoriler')
                                              .select('id, alt_kategori_adi, kategori_id')
                                              .eq('id', dukkan.alt_kategori_id)
                                              .single();

                                            if (altKategori) {
                                              const { data: anaKategori } = await supabase
                                                .from('kategoriler')
                                                .select('id, kategori_adi, icon, renk')
                                                .eq('id', altKategori.kategori_id)
                                                .single();

                                              return {
                                                ...dukkan,
                                                alt_kategoriler: {
                                                  ...altKategori,
                                                  kategoriler: anaKategori
                                                }
                                              };
                                            }
                                            return dukkan;
                                          })
                                        );

                                        // Firmalar modalını aç
                                        setSeciliAltKategoriDetay(altKat);
                                        setFirmaListesi(dukkanlarWithKategoriler);
                                        setFirmalarModalAcik(true);
                                      }}
                                      className="w-full bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-all hover:border-purple-400 hover:from-purple-100 hover:to-purple-200 cursor-pointer text-left"
                                    >
                                      <div className="font-bold text-gray-800 mb-1">{altKat.alt_kategori_adi}</div>
                                      <div className="text-xs text-purple-600 font-semibold">
                                        {anaKategori?.kategori_adi || 'Kategori'}
                                        <span className="text-gray-500 ml-1">• Firmaları göster</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      }

                      // Kategori araması veya normal görünüm
                      const filtreliKategoriler = modalVeriler.filter((kategori: any) => {
                        if (!modalAramaMetni) return true;
                        const aramaKelime = modalAramaMetni.toLowerCase();
                        return kategori.kategori_adi?.toLowerCase().includes(aramaKelime);
                      });

                      if (filtreliKategoriler.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-2">🔍</div>
                            <div className="text-gray-700 font-bold mb-1">Sonuç bulunamadı</div>
                            <div className="text-gray-500 text-sm">"{modalAramaMetni}" için sonuç bulunamadı</div>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filtreliKategoriler.map((kategori: any) => {
                            const altKategoriler = veriler.altKategoriler.filter(
                              (ak: any) => ak.kategori_id === kategori.id
                            );

                            // Arama yapıldıysa ve alt kategoride eşleşme varsa göster
                            const eslesenAltKategoriler = modalAramaMetni
                              ? altKategoriler.filter((ak: any) =>
                                  ak.alt_kategori_adi?.toLowerCase().includes(modalAramaMetni.toLowerCase())
                                )
                              : [];

                            return (
                              <button
                                key={kategori.id}
                                onClick={() => {
                                  // Kategori tıklandığında alt kategorileri göster
                                  setSeciliKategoriDetay(kategori);
                                  setAltKategoriListesi(altKategoriler);
                                  setAltKategoriModalAcik(true);
                                }}
                                className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border-2 border-blue-200 hover:shadow-md hover:from-blue-100 hover:to-indigo-100 transition-all cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-3xl">{kategori.icon || '📦'}</div>
                                  <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{kategori.kategori_adi}</h3>
                                    <div className="text-xs text-gray-500">
                                      {altKategoriler.length} alt kategori
                                      {eslesenAltKategoriler.length > 0 && (
                                        <span className="ml-2 text-green-600 font-bold">
                                          • {eslesenAltKategoriler.length} eşleşme
                                        </span>
                                      )}
                                    </div>
                                    {/* Eşleşen alt kategorileri göster */}
                                    {eslesenAltKategoriler.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {eslesenAltKategoriler.slice(0, 3).map((ak: any) => (
                                          <span
                                            key={ak.id}
                                            className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold"
                                          >
                                            {ak.alt_kategori_adi}
                                          </span>
                                        ))}
                                        {eslesenAltKategoriler.length > 3 && (
                                          <span className="text-xs text-gray-500">
                                            +{eslesenAltKategoriler.length - 3} daha
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-blue-500 text-xl">→</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">
                  Toplam: <span className="font-bold text-gray-800">{modalVeriler.length}</span> kayıt
                </div>
                <button onClick={modalKapat} className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg transition-all text-sm">
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alt Kategoriler Modal */}
        {altKategoriModalAcik && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setAltKategoriModalAcik(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{seciliKategoriDetay?.icon || '📦'}</span>
                      <div>
                        <h2 className="text-2xl font-bold">{seciliKategoriDetay?.kategori_adi || 'Alt Kategoriler'}</h2>
                        <p className="text-blue-100 text-sm mt-1">{altKategoriListesi.length} alt kategori</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setAltKategoriModalAcik(false)} className="text-white hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition-all">
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {altKategoriListesi.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📂</div>
                    <div className="text-gray-700 font-bold text-xl mb-2">Alt Kategori Yok</div>
                    <div className="text-gray-500">Bu kategoride henüz alt kategori bulunmamaktadır.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {altKategoriListesi.map((altKat: any) => (
                      <button
                        key={altKat.id}
                        onClick={async () => {
                          // Alt kategoriye tıklandığında firmaları yükle ve modal aç
                          const { data: dukkanlar } = await supabase
                            .from('dukkanlar')
                            .select('*')
                            .eq('alt_kategori_id', altKat.id);

                          // Her dükkan için kategori bilgisini ekle
                          const dukkanlarWithKategoriler = await Promise.all(
                            (dukkanlar || []).map(async (dukkan) => {
                              const { data: altKategori } = await supabase
                                .from('alt_kategoriler')
                                .select('id, alt_kategori_adi, kategori_id')
                                .eq('id', dukkan.alt_kategori_id)
                                .single();

                              if (altKategori) {
                                const { data: anaKategori } = await supabase
                                  .from('kategoriler')
                                  .select('id, kategori_adi, icon, renk')
                                  .eq('id', altKategori.kategori_id)
                                  .single();

                                return {
                                  ...dukkan,
                                  alt_kategoriler: {
                                    ...altKategori,
                                    kategoriler: anaKategori
                                  }
                                };
                              }
                              return dukkan;
                            })
                          );

                          // Firmalar modalını aç
                          setSeciliAltKategoriDetay(altKat);
                          setFirmaListesi(dukkanlarWithKategoriler);
                          setFirmalarModalAcik(true);
                        }}
                        className="w-full bg-gradient-to-br from-indigo-50 to-blue-100 p-4 rounded-xl border-2 border-indigo-200 hover:shadow-lg transition-all hover:border-indigo-400 hover:from-indigo-100 hover:to-blue-200 cursor-pointer text-left"
                      >
                        <div className="font-bold text-gray-800 text-lg mb-1">{altKat.alt_kategori_adi}</div>
                        <div className="text-xs text-indigo-600 font-semibold">
                          {seciliKategoriDetay?.kategori_adi}
                          <span className="text-gray-500 ml-1">• Firmaları göster</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-bold">{seciliKategoriDetay?.kategori_adi}</span> kategorisi
                </div>
                <button onClick={() => setAltKategoriModalAcik(false)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all">
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Firmalar Modal */}
        {firmalarModalAcik && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]" onClick={() => setFirmalarModalAcik(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{seciliAltKategoriDetay?.alt_kategori_adi || 'Firmalar'}</h2>
                    <p className="text-purple-100 text-sm mt-1">Kayıtlı Firmalar Listesi</p>
                  </div>
                  <button onClick={() => setFirmalarModalAcik(false)} className="text-white hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition-all">
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {firmaListesi.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏪</div>
                    <div className="text-gray-700 font-bold text-xl mb-2">Kayıtlı Firma Yok</div>
                    <div className="text-gray-500">Bu alt kategoride henüz kayıtlı firma bulunmamaktadır.</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 font-medium mb-4">
                      Toplam: <span className="font-bold text-gray-800">{firmaListesi.length}</span> firma
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {firmaListesi.map((firma: any) => (
                        <div key={firma.id} className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 text-lg mb-1">{firma.isletme_adi}</h3>
                              {firma.alt_kategoriler?.kategoriler && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-2xl">{firma.alt_kategoriler.kategoriler.icon || '📦'}</span>
                                  <span className="text-purple-700 font-semibold">{firma.alt_kategoriler.kategoriler.kategori_adi}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-purple-600">{firma.alt_kategoriler.alt_kategori_adi}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            {firma.yetkili_adi && (
                              <div className="flex items-center gap-2">
                                <span>👤</span>
                                <span className="font-medium">{firma.yetkili_adi}</span>
                              </div>
                            )}
                            {firma.telefon && (
                              <div className="flex items-center gap-2">
                                <span>📞</span>
                                <span className="font-mono">{firma.telefon}</span>
                              </div>
                            )}
                            {firma.adres && (
                              <div className="flex items-center gap-2">
                                <span>📍</span>
                                <span className="text-xs">{firma.adres}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-bold">{seciliAltKategoriDetay?.alt_kategori_adi}</span> kategorisi
                </div>
                <button onClick={() => setFirmalarModalAcik(false)} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all">
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 text-white" style={{ backgroundColor: '#1a3a6b' }}>
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Hakkımızda Bölümü */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-yellow-400">ÜMRANİYE SANAYİ SİTESİ</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">Firmalar Rehberi</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Ümraniye'deki sanayi sitelerindeki firmaları tek platformda bulun. 1886+ kayıtlı firma ile bölgenin en kapsamlı rehberi.
                </p>
              </div>

              {/* Hızlı Erişim */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-yellow-400">Hızlı Erişim</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Anasayfa</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Tüm Firmalar</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Özel Firmalar</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">İlanlar</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">Firma Ekle</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">İletişim</a></li>
                </ul>
              </div>

              {/* İletişim */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-yellow-400">İletişim</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">📍</span>
                    <span className="text-gray-300 text-xs">140 Simcoe Street, Toronto, Ontario, Canada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">📞</span>
                    <span className="text-gray-300 text-xs">+1-(647)-561-41-94 (Canada)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">📞</span>
                    <span className="text-gray-300 text-xs">05353594763 (Türkiye)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">✉️</span>
                    <a href="mailto:info@umraniyesanayisitesi.com" className="text-gray-300 hover:text-yellow-400 transition-colors text-xs">info@umraniyesanayisitesi.com</a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">📍</span>
                    <span className="text-gray-300 text-xs">Ümraniye, İstanbul</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* QR Kodlar */}
            <div className="mt-8 pt-6 border-t border-gray-700 text-center">
              <h3 className="text-yellow-400 font-bold text-lg mb-4">Mobil Uygulama</h3>
              <p className="text-gray-400 text-sm mb-6">QR kodu okut, telefona uygulama gibi ekle</p>
              <div className="flex justify-center gap-8 flex-wrap">
                {/* iOS QR */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl inline-block shadow-lg mb-3">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://umraniyesanayisitesi.com"
                      alt="iOS QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-300">
                    <span className="text-xl">📱</span>
                    <span className="font-semibold">iPhone</span>
                  </div>
                </div>

                {/* Android QR */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl inline-block shadow-lg mb-3">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://umraniyesanayisitesi.com"
                      alt="Android QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-300">
                    <span className="text-xl">🤖</span>
                    <span className="font-semibold">Android</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-xs italic mt-4">Tarayıcıda aç → "Ana Ekrana Ekle"</p>
            </div>

            {/* Copyright */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Copyright ©2026 <span className="text-yellow-400 font-semibold">Appmmel Service Solutions</span> — Tüm Hakları Saklıdır.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}