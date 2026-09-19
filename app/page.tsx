'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
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

    // Tüm sanayi sitelerini yükle (geçici - ilçe eşleştirmesi yapılmamış)
    const { data: sitelerData } = await supabase
      .from('sanayi_siteleri')
      .select('*')
      .order('site_adi');

    setVeriler(prev => ({ ...prev, mahalleler: [], sokaklar: [], siteler: sitelerData || [], dukkanlar: [] }));
  };

  const mahalleSec = async (mahalle_id: string) => {
    setSecim(prev => ({ ...prev, mahalle: mahalle_id, sokak: '', site: '' }));
    const { data } = await supabase.from('sokaklar').select('*').eq('mahalle_id', parseInt(mahalle_id)).order('sokak_adi');

    // Unique sokak_id bazında filtrele (duplicate kayıtlar olabilir)
    const uniqueSokaklar = data ? Array.from(
      new Map(data.map(s => [s.sokak_id, s])).values()
    ) : [];

    setVeriler(prev => ({ ...prev, sokaklar: uniqueSokaklar, dukkanlar: [] }));
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-lg px-8 py-4 rounded-3xl shadow-xl border border-yellow-200/50 mb-4">
            <span className="text-5xl">🐝</span>
            <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-tight">
              KOVAN PORTAL
            </h1>
          </div>
          <p className="text-gray-600 font-medium text-sm">Türkiye'nin Sanayi Rehberi</p>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 p-6 rounded-3xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-sm font-bold text-yellow-900/70 uppercase tracking-wider mb-2">Sanayi Sitesi</div>
              <div className="text-5xl font-black text-white mb-1">{istatistikler.toplamSite}</div>
              <div className="text-xs text-yellow-900/60 font-medium">Kayıtlı Lokasyon</div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 rounded-3xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Toplam Dükkan</div>
              <div className="text-5xl font-black text-white mb-1">{istatistikler.toplamDukkan}</div>
              <div className="text-xs text-slate-400 font-medium">Aktif İşletme</div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 rounded-3xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2">Kategoriler</div>
              <div className="text-5xl font-black text-white mb-1">{istatistikler.toplamKategori}</div>
              <div className="text-xs text-blue-200 font-medium">Farklı Sektör</div>
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

        {/* Seçim Paneli */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">📍 Şehir Seçin</label>
              <select
                className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 font-bold text-gray-700 outline-none transition-all hover:border-yellow-400 focus:border-yellow-500 focus:shadow-lg appearance-none cursor-pointer"
                onChange={(e) => ilSec(e.target.value)}
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
              >
                <option value="">İlçe Seç</option>
                {veriler.ilceler.map((ilce: any) => <option key={ilce.id} value={ilce.ilce_adi}>{ilce.ilce_adi}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">🏭 Sanayi Sitesi Seçin</label>
              <select
                className="w-full p-4 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-2xl border-2 border-yellow-500 font-black text-gray-900 outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-yellow-500 hover:to-amber-500 focus:shadow-xl appearance-none cursor-pointer"
                onChange={(e) => siteSec(e.target.value)}
                disabled={!secim.ilce}
              >
                <option value="">{veriler.siteler.length > 0 ? "Sanayi Sitesi Seç" : "Kayıt Bulunamadı"}</option>
                {veriler.siteler.map((s: any) => <option key={s.id} value={s.id}>{s.site_adi}</option>)}
              </select>
            </div>
          </div>
        </div>

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
          ) : secim.site && (
            <div className="col-span-full text-center p-12 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 animate-in fade-in">
              <div className="text-7xl mb-4">🏭</div>
              <div className="text-gray-700 font-bold text-lg mb-2">Bu sitede henüz dükkan kaydı yok</div>
              <div className="text-gray-500 text-sm">Yakında bu sanayi sitesine dükkanlar eklenecektir</div>
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