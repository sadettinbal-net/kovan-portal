'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UstMenu from '@/components/site/UstMenu';
import AltBilgi from '@/components/site/AltBilgi';
import FirmaKarti from '@/components/site/FirmaKarti';
import { kategorileriYukle, siteleriYukle, toplamFirmaSayisi, type AltKategori, type Kategori, type Site } from '@/lib/rehber';

// Yeni ana sayfa tasarımı (önizleme): arama, solda sanayi siteleri, firma kartları, sanayi siteleri bölümü
const VITRIN_SAYISI = 9;

export default function YeniTasarimPage() {
  const router = useRouter();
  const [toplamFirma, setToplamFirma] = useState(0);
  const [siteler, setSiteler] = useState<Site[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [altKategoriler, setAltKategoriler] = useState<Map<number, AltKategori>>(new Map());
  const [firmalar, setFirmalar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaKutusu, setAramaKutusu] = useState('');

  useEffect(() => {
    (async () => {
      const [toplam, siteListesi, kat, { data }] = await Promise.all([
        toplamFirmaSayisi(),
        siteleriYukle(),
        kategorileriYukle(),
        // Resmi olan firmalar önce, en yeniler üstte
        supabase
          .from('dukkanlar')
          .select('*')
          .order('kart_resmi', { ascending: true, nullsFirst: false })
          .order('id', { ascending: false })
          .limit(VITRIN_SAYISI),
      ]);
      setToplamFirma(toplam);
      setSiteler(siteListesi);
      setKategoriler(kat.kategoriler);
      setAltKategoriler(kat.altKategoriler);
      setFirmalar(data || []);
      setYukleniyor(false);
    })();
  }, []);

  const kategoriMap = useMemo(() => new Map(kategoriler.map((k) => [k.id, k])), [kategoriler]);
  const siteAdi = useMemo(() => new Map(siteler.map((s) => [s.id, s.site_adi])), [siteler]);
  const doluSiteler = siteler.filter((s) => s.sayi > 0);
  // Henüz firması olan site yoksa listeyi boş göstermemek için ilk siteleri göster
  const yanListe = (doluSiteler.length > 0 ? doluSiteler : siteler).slice(0, 15);

  const aramaYap = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(aramaKutusu.trim() ? `/firmalar?q=${encodeURIComponent(aramaKutusu.trim())}` : '/firmalar');
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-gray-800">
      <UstMenu />

      {/* Arama */}
      <section className="bg-[#1a3a6b] pb-10 pt-8 px-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Kovan Portal Sanayi Firma Rehberi</h1>
        <p className="mt-2 text-white/80">
          {toplamFirma > 0 ? `${toplamFirma.toLocaleString('tr-TR')}+ kayıtlı firma arasından arayın` : 'Firma rehberinde arayın'}
        </p>
        <form onSubmit={aramaYap} className="mt-6 max-w-3xl mx-auto flex gap-3">
          <input
            type="search"
            value={aramaKutusu}
            onChange={(e) => setAramaKutusu(e.target.value)}
            placeholder="Firma adı, kategori veya hizmet arayın..."
            className="flex-1 min-w-0 h-14 px-5 rounded-md bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-4 focus:ring-[#e8a020]/40"
          />
          <button
            type="submit"
            className="h-14 px-6 sm:px-8 bg-[#e8a020] hover:bg-[#c8851a] text-white font-bold rounded-md transition flex items-center gap-2"
          >
            🔍 <span className="hidden sm:inline">Ara</span>
          </button>
        </form>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        {/* Sol: Sanayi siteleri */}
        <aside className="md:w-56 lg:w-64 shrink-0">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <h2 className="bg-[#1a3a6b] text-white text-sm font-bold uppercase tracking-wide px-4 py-3">Sanayi Siteleri</h2>
            <ul className="divide-y divide-gray-100">
              <li>
                <Link href="/firmalar" className="flex items-center justify-between gap-2 px-4 py-3 text-sm bg-[#eaf3ff] font-bold text-[#1a3a6b]">
                  <span>Tümü</span>
                  <span className="bg-[#1a3a6b] text-white text-xs font-bold px-2 py-0.5 rounded-full">{toplamFirma}</span>
                </Link>
              </li>
              {yanListe.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/firmalar?site=${s.id}`}
                    className="flex items-center justify-between gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <span>{s.site_adi}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">{s.sayi}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/firmalar" className="block text-center text-sm font-semibold text-[#2554a0] hover:underline py-3 border-t border-gray-100">
              Tüm siteler →
            </Link>
          </div>
        </aside>

        {/* Sağ: Firmalar ve kategoriler */}
        <div className="flex-1 min-w-0 space-y-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a3a6b] flex items-center gap-2">
                <span className="text-[#e8a020]">★</span> Firmalar
              </h2>
              <Link href="/firmalar" className="text-[#1a3a6b] font-semibold hover:underline">
                Tümünü Gör →
              </Link>
            </div>
            {yukleniyor ? (
              <div className="bg-white rounded-lg p-12 text-center text-gray-500">Yükleniyor...</div>
            ) : firmalar.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center text-gray-500">Henüz kayıtlı firma yok</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {firmalar.map((f) => {
                  const alt = altKategoriler.get(f.alt_kategori_id);
                  return (
                    <FirmaKarti
                      key={f.id}
                      firma={f}
                      alt={alt}
                      ana={alt ? kategoriMap.get(alt.kategori_id) : undefined}
                      siteAdi={f.site_id ? siteAdi.get(f.site_id) : undefined}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {kategoriler.length > 0 && (
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a3a6b] mb-4">📂 Kategoriler</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {kategoriler.map((k) => (
                  <Link
                    key={k.id}
                    href={`/firmalar?kategori=${k.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md p-4 flex items-center gap-3 transition border-l-4"
                    style={{ borderLeftColor: k.renk || '#1a3a6b' }}
                  >
                    <span className="text-2xl">{k.icon || '📦'}</span>
                    <span className="text-sm font-bold text-gray-700">{k.kategori_adi}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <AltBilgi />
    </div>
  );
}
