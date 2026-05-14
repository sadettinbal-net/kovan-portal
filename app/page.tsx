'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [secim, setSecim] = useState({ il: '', ilce: '', site: '' });
  const [veriler, setVeriler] = useState({ iller: [], ilceler: [], siteler: [], dukkanlar: [] });
  const [hata, setHata] = useState('');

  useEffect(() => {
    async function ilkYukleme() {
      const { data, error } = await supabase.from('iller').select('*').order('sehir_adi');
      if (error) setHata("Bağlantı Hatası: " + error.message);
      else setVeriler(prev => ({ ...prev, iller: data || [] }));
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans max-w-lg mx-auto">
      <h1 className="text-3xl font-black mb-8 text-center text-yellow-500 italic uppercase tracking-tighter">🐝 KOVAN PORTAL</h1>
      
      {hata && <div className="bg-red-100 text-red-600 p-4 mb-4 rounded-2xl text-sm">{hata}</div>}

      <div className="space-y-4 bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 mb-8">
        <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-700 outline-none" onChange={(e) => ilSec(e.target.value)}>
          <option value="">Şehir Seç</option>
          {veriler.iller.map((il: any) => <option key={il.id} value={il.id}>{il.sehir_adi}</option>)}
        </select>

        <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-gray-700 outline-none disabled:opacity-30" onChange={(e) => ilceSec(e.target.value)} disabled={!secim.il}>
          <option value="">İlçe Seç</option>
          {veriler.ilceler.map((ilce: any) => <option key={ilce.id} value={ilce.id}>{ilce.ilce_adi}</option>)}
        </select>

        <select className="w-full p-4 bg-yellow-400 rounded-2xl border-none font-black text-black outline-none disabled:opacity-30" onChange={(e) => siteSec(e.target.value)} disabled={!secim.ilce}>
          <option value="">{veriler.siteler.length > 0 ? "Sanayi Sitesi Seç" : "Kayıt Bulunamadı"}</option>
          {veriler.siteler.map((s: any) => <option key={s.id} value={s.id}>{s.site_adi}</option>)}
        </select>
      </div>

      {/* DÜKKAN LİSTESİ */}
      <div className="space-y-4">
        {veriler.dukkanlar.length > 0 ? (
          veriler.dukkanlar.map((dukkan: any) => (
            <div key={dukkan.id} className="bg-white p-6 rounded-[2rem] shadow-lg border-l-8 border-yellow-400 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-black text-gray-800 uppercase">{dukkan.dukkan_adi}</h2>
                <span className="bg-yellow-100 text-yellow-700 text-[10px] px-3 py-1 rounded-full font-black uppercase">{dukkan.kategori}</span>
              </div>
              <p className="text-gray-500 font-medium mb-4">Usta: {dukkan.usta_adi}</p>
              <a href={`tel:${dukkan.telefon}`} className="inline-flex items-center justify-center w-full bg-black text-white p-4 rounded-2xl font-bold gap-2 hover:bg-gray-800 transition-colors">
                📞 {dukkan.telefon}
              </a>
            </div>
          ))
        ) : secim.site && (
          <div className="text-center p-10 text-gray-400 font-bold italic">Bu sitede henüz dükkan kaydı yok.</div>
        )}
      </div>

      {/* Teknik Bilgi Kısmı - İş bittiğinde silebilirsin */}
      <div className="mt-10 p-4 bg-gray-200 rounded-2xl text-[10px] font-mono text-gray-600 opacity-50">
        İlçe ID: {secim.ilce} | Site ID: {secim.site} | Dükkan: {veriler.dukkanlar.length}
      </div>
    </div>
  );
}