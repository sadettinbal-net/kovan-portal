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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 font-sans max-w-lg mx-auto">
      <h1 className="text-3xl font-black mb-6 text-center text-yellow-500 italic uppercase tracking-tighter animate-in fade-in slide-in-from-top-4 duration-700">
        🐝 KOVAN PORTAL
      </h1>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-in fade-in slide-in-from-top-8 duration-700">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-4 rounded-2xl shadow-lg text-center transform transition-all hover:scale-105 hover:shadow-xl">
          <div className="text-2xl font-black text-white">{istatistikler.toplamSite}</div>
          <div className="text-[10px] font-bold text-yellow-900 uppercase tracking-wide">Sanayi Sitesi</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-lg text-center transform transition-all hover:scale-105 hover:shadow-xl">
          <div className="text-2xl font-black text-white">{istatistikler.toplamDukkan}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Dükkan</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg text-center transform transition-all hover:scale-105 hover:shadow-xl">
          <div className="text-2xl font-black text-white">{istatistikler.toplamKategori}</div>
          <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wide">Kategori</div>
        </div>
      </div>

      {hata && <div className="bg-red-100 text-red-600 p-4 mb-4 rounded-2xl text-sm animate-in fade-in slide-in-from-top-4">{hata}</div>}

      <div className="space-y-4 bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-700 outline-none transition-all hover:bg-gray-100" onChange={(e) => ilSec(e.target.value)}>
          <option value="">Şehir Seç</option>
          {veriler.iller.map((il: any) => <option key={il.id} value={il.id}>{il.sehir_adi}</option>)}
        </select>

        <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-700 outline-none disabled:opacity-30 transition-all hover:bg-gray-100" onChange={(e) => ilceSec(e.target.value)} disabled={!secim.il}>
          <option value="">İlçe Seç</option>
          {veriler.ilceler.map((ilce: any) => <option key={ilce.id} value={ilce.id}>{ilce.ilce_adi}</option>)}
        </select>

        <select className="w-full p-4 bg-yellow-400 rounded-2xl border-none font-black text-black outline-none disabled:opacity-30 transition-all hover:bg-yellow-500" onChange={(e) => siteSec(e.target.value)} disabled={!secim.ilce}>
          <option value="">{veriler.siteler.length > 0 ? "Sanayi Sitesi Seç" : "Kayıt Bulunamadı"}</option>
          {veriler.siteler.map((s: any) => <option key={s.id} value={s.id}>{s.site_adi}</option>)}
        </select>
      </div>

      {/* Arama ve Filtreleme */}
      {veriler.dukkanlar.length > 0 && (
        <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <input
            type="text"
            placeholder="🔍 Dükkan, usta veya kategori ara..."
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            className="w-full p-4 bg-white rounded-2xl border-2 border-gray-200 font-medium text-gray-700 outline-none focus:border-yellow-400 transition-all placeholder:text-gray-400"
          />

          {kategoriler.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSeciliKategori('')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  !seciliKategori
                    ? 'bg-yellow-400 text-black shadow-lg scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tümü
              </button>
              {kategoriler.map((kat: string) => (
                <button
                  key={kat}
                  onClick={() => setSeciliKategori(kat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    seciliKategori === kat
                      ? 'bg-yellow-400 text-black shadow-lg scale-105'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-500 font-medium text-center">
            {filtreliDukkanlar.length} dükkan bulundu
          </div>
        </div>
      )}

      {/* DÜKKAN LİSTESİ */}
      <div className="space-y-4 pb-8">
        {filtreliDukkanlar.length > 0 ? (
          filtreliDukkanlar.map((dukkan: any, index: number) => (
            <div
              key={dukkan.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="bg-white p-6 rounded-[2rem] shadow-lg border-l-8 border-yellow-400 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-2xl hover:scale-[1.02] transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-black text-gray-800 uppercase">{dukkan.dukkan_adi}</h2>
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-[10px] px-3 py-1 rounded-full font-black uppercase shadow-md">
                  {dukkan.kategori}
                </span>
              </div>
              <p className="text-gray-500 font-medium mb-4">👤 {dukkan.usta_adi}</p>
              <a
                href={`tel:${dukkan.telefon}`}
                className="inline-flex items-center justify-center w-full bg-gradient-to-r from-gray-900 to-black text-white p-4 rounded-2xl font-bold gap-2 hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                📞 {dukkan.telefon}
              </a>
            </div>
          ))
        ) : veriler.dukkanlar.length > 0 ? (
          <div className="text-center p-10 bg-white rounded-[2rem] shadow-lg animate-in fade-in">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-gray-600 font-bold">Arama kriterlerine uygun dükkan bulunamadı.</div>
            <button
              onClick={() => {
                setAramaMetni('');
                setSeciliKategori('');
              }}
              className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-full font-bold hover:bg-yellow-500 transition-all"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : secim.site && (
          <div className="text-center p-10 bg-white rounded-[2rem] shadow-lg animate-in fade-in">
            <div className="text-6xl mb-4">🏭</div>
            <div className="text-gray-600 font-bold">Bu sitede henüz dükkan kaydı yok.</div>
          </div>
        )}
      </div>

      {/* Teknik Bilgi Kısmı - İş bittiğinde silebilirsin */}
      <div className="mt-10 p-4 bg-gray-200 rounded-2xl text-[10px] font-mono text-gray-600 opacity-50">
        İlçe ID: {secim.ilce} | Site ID: {secim.site} | Dükkan: {veriler.dukkanlar.length}
      </div>
    </div>
  );
}