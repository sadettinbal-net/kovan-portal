'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [secim, setSecim] = useState({ il: '', ilce: '', site: '' });
  const [veriler, setVeriler] = useState({ iller: [], ilceler: [], siteler: [], dukkanlar: [] });
  const [hata, setHata] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');
  const [seciliKategori, setSeciliKategori] = useState('');
  const [istatistikler, setIstatistikler] = useState({ toplamSite: 0, toplamDukkan: 0, toplamKategori: 0 });

  useEffect(() => {
    async function ilkYukleme() {
      const { data, error } = await supabase.from('iller').select('*').order('sehir_adi');
      if (error) setHata("Bağlantı Hatası: " + error.message);
      else setVeriler(prev => ({ ...prev, iller: data || [] }));

      // İstatistikleri yükle
      const { data: siteData } = await supabase.from('sanayi_siteleri').select('id');
      const { data: dukkanData } = await supabase.from('dukkanlar').select('id, kategori');
      const kategoriler = new Set(dukkanData?.map((d: any) => d.kategori) || []);

      setIstatistikler({
        toplamSite: siteData?.length || 0,
        toplamDukkan: dukkanData?.length || 0,
        toplamKategori: kategoriler.size
      });
    }
    ilkYukleme();
  }, []);

  const ilSec = async (id: string) => {
    setSecim({ il: id, ilce: '', site: '' });
    const { data } = await supabase.from('ilceler').select('*').eq('sehir_id', id).order('ilce_adi');
    setVeriler(prev => ({ ...prev, ilceler: data || [], siteler: [], dukkanlar: [] }));
  };

  const ilceSec = async (id: string) => {
    setSecim(prev => ({ ...prev, ilce: id, site: '' }));
    const { data } = await supabase.from('sanayi_siteleri').select('*').eq('ilce_id', parseInt(id));
    setVeriler(prev => ({ ...prev, siteler: data || [], dukkanlar: [] }));
  };

  const siteSec = async (id: string) => {
    setSecim(prev => ({ ...prev, site: id }));
    const { data } = await supabase.from('dukkanlar').select('*').eq('site_id', parseInt(id));
    setVeriler(prev => ({ ...prev, dukkanlar: data || [] }));
    setAramaMetni('');
    setSeciliKategori('');
  };

  // Filtrelenmiş dükkanlar
  const filtreliDukkanlar = useMemo(() => {
    let sonuc = veriler.dukkanlar;

    // Arama filtresi
    if (aramaMetni) {
      sonuc = sonuc.filter((d: any) =>
        d.dukkan_adi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        d.usta_adi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        d.kategori.toLowerCase().includes(aramaMetni.toLowerCase())
      );
    }

    // Kategori filtresi
    if (seciliKategori) {
      sonuc = sonuc.filter((d: any) => d.kategori === seciliKategori);
    }

    return sonuc;
  }, [veriler.dukkanlar, aramaMetni, seciliKategori]);

  // Mevcut kategoriler
  const kategoriler = useMemo(() => {
    const cats = new Set(veriler.dukkanlar.map((d: any) => d.kategori));
    return Array.from(cats).sort();
  }, [veriler.dukkanlar]);

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
                {veriler.iller.map((il: any) => <option key={il.id} value={il.id}>{il.sehir_adi}</option>)}
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
                {veriler.ilceler.map((ilce: any) => <option key={ilce.id} value={ilce.id}>{ilce.ilce_adi}</option>)}
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

            {kategoriler.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-gray-200/50">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Kategoriler</div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSeciliKategori('')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      !seciliKategori
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tümü
                  </button>
                  {kategoriler.map((kat: string) => (
                    <button
                      key={kat}
                      onClick={() => setSeciliKategori(kat)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        seciliKategori === kat
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {kat}
                    </button>
                  ))}
                </div>
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
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 text-xs px-3 py-1.5 rounded-xl font-black uppercase shadow-md whitespace-nowrap">
                    {dukkan.kategori}
                  </span>
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
                  setSeciliKategori('');
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