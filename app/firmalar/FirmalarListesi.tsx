'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FirmaKarti from '@/components/site/FirmaKarti';
import { aramaSuzgeci, kategorileriYukle, siteleriYukle, type AltKategori, type Kategori, type Site } from '@/lib/rehber';

// Firmalar sayfası: il, sanayi sitesi, kategori ve arama süzgeçleri; sayfada 21 / 51 / 99 firma
const SAYFA_BOYUTLARI = [21, 51, 99];

export default function FirmalarListesi() {
  const router = useRouter();
  const params = useSearchParams();
  const il = params.get('il') || '';
  const site = params.get('site') ? parseInt(params.get('site')!) : null;
  const kategori = params.get('kategori') ? parseInt(params.get('kategori')!) : null;
  const q = params.get('q') || '';
  const limit = SAYFA_BOYUTLARI.includes(parseInt(params.get('limit') || '')) ? parseInt(params.get('limit')!) : 21;
  const sayfa = Math.max(1, parseInt(params.get('sayfa') || '1') || 1);

  const [siteler, setSiteler] = useState<Site[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [altKategoriler, setAltKategoriler] = useState<Map<number, AltKategori>>(new Map());
  const [hazir, setHazir] = useState(false);
  const [firmalar, setFirmalar] = useState<any[]>([]);
  const [bulunan, setBulunan] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaKutusu, setAramaKutusu] = useState(q);
  const [siteArama, setSiteArama] = useState('');

  useEffect(() => setAramaKutusu(q), [q]);

  useEffect(() => {
    Promise.all([siteleriYukle(), kategorileriYukle()]).then(([s, k]) => {
      setSiteler(s);
      setKategoriler(k.kategoriler);
      setAltKategoriler(k.altKategoriler);
      setHazir(true);
    });
  }, []);

  const kategoriMap = useMemo(() => new Map(kategoriler.map((k) => [k.id, k])), [kategoriler]);
  const siteAdi = useMemo(() => new Map(siteler.map((s) => [s.id, s.site_adi])), [siteler]);
  const iller = useMemo(
    () => [...new Set(siteler.map((s) => s.il_adi).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'tr')),
    [siteler]
  );
  const ildekiSiteler = il ? siteler.filter((s) => s.il_adi === il) : siteler;
  const gorunenSiteler = ildekiSiteler.filter((s) =>
    siteArama ? s.site_adi.toLocaleLowerCase('tr').includes(siteArama.toLocaleLowerCase('tr')) : true
  );

  // Firma listesi
  useEffect(() => {
    if (!hazir) return;
    (async () => {
      setYukleniyor(true);
      let sorgu = supabase
        .from('dukkanlar')
        .select('*', { count: 'exact' })
        .order('kart_resmi', { ascending: true, nullsFirst: false })
        .order('dukkan_adi')
        .range((sayfa - 1) * limit, sayfa * limit - 1);

      if (site) {
        sorgu = sorgu.eq('site_id', site);
      } else if (il) {
        sorgu = sorgu.in('site_id', siteler.filter((s) => s.il_adi === il).map((s) => s.id));
      }
      if (kategori) {
        const altIdler = [...altKategoriler.values()].filter((a) => a.kategori_id === kategori).map((a) => a.id);
        sorgu = sorgu.in('alt_kategori_id', altIdler.length ? altIdler : [-1]);
      }
      const suzgec = aramaSuzgeci(q);
      if (suzgec) sorgu = sorgu.or(suzgec);

      const { data, count } = await sorgu;
      setFirmalar(data || []);
      setBulunan(count || 0);
      setYukleniyor(false);
    })();
  }, [hazir, il, site, kategori, q, limit, sayfa, siteler, altKategoriler]);

  // Süzgeci adres çubuğuna yaz; sayfa numarası başa döner
  const git = (degisiklik: Record<string, string | number | null>) => {
    const yeni = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(degisiklik)) {
      if (v === null || v === '') yeni.delete(k);
      else yeni.set(k, String(v));
    }
    if (!('sayfa' in degisiklik)) yeni.delete('sayfa');
    router.push(`/firmalar${yeni.toString() ? `?${yeni}` : ''}`, { scroll: false });
  };

  const sayfaSayisi = Math.max(1, Math.ceil(bulunan / limit));
  const baslangic = bulunan === 0 ? 0 : (sayfa - 1) * limit + 1;
  const bitis = Math.min(sayfa * limit, bulunan);
  const baslik = site ? siteAdi.get(site) : kategori ? kategoriMap.get(kategori)?.kategori_adi : il || 'Tüm Firmalar';

  // Gösterilecek sayfa numaraları: ilk, son ve seçilinin çevresi
  const numaralar = [...new Set([1, sayfa - 1, sayfa, sayfa + 1, sayfaSayisi])]
    .filter((n) => n >= 1 && n <= sayfaSayisi)
    .sort((a, b) => a - b);

  const secimClass = (secili: boolean) =>
    `w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition ${
      secili ? 'bg-[#eaf3ff] font-bold text-[#1a3a6b]' : 'text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <>
      {/* Arama */}
      <section className="bg-[#1a3a6b] px-4 py-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            git({ q: aramaKutusu.trim() });
          }}
          className="max-w-3xl mx-auto flex gap-3"
        >
          <input
            type="search"
            value={aramaKutusu}
            onChange={(e) => setAramaKutusu(e.target.value)}
            placeholder="Firma adı, kategori veya hizmet arayın..."
            className="flex-1 min-w-0 h-12 px-5 rounded-md bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-4 focus:ring-[#e8a020]/40"
          />
          <button type="submit" className="h-12 px-6 bg-[#e8a020] hover:bg-[#c8851a] text-white font-bold rounded-md transition">
            🔍 <span className="hidden sm:inline">Ara</span>
          </button>
        </form>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        {/* Sol: Süzgeçler */}
        <aside className="md:w-60 lg:w-64 shrink-0 space-y-4">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <h2 className="bg-[#1a3a6b] text-white text-sm font-bold uppercase tracking-wide px-4 py-3">Sanayi Siteleri</h2>
            <div className="p-3 space-y-2 border-b border-gray-100">
              <select
                value={il}
                onChange={(e) => git({ il: e.target.value, site: null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                aria-label="İl seçin"
              >
                <option value="">Tüm iller</option>
                {iller.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <input
                type="search"
                value={siteArama}
                onChange={(e) => setSiteArama(e.target.value)}
                placeholder="Site ara..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              <li>
                <button onClick={() => git({ site: null })} className={secimClass(site === null)}>
                  <span>Tümü</span>
                </button>
              </li>
              {gorunenSiteler.map((s) => (
                <li key={s.id}>
                  <button onClick={() => git({ site: s.id })} className={secimClass(site === s.id)}>
                    <span>{s.site_adi}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        site === s.id ? 'bg-[#1a3a6b] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {s.sayi}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <h2 className="bg-[#1a3a6b] text-white text-sm font-bold uppercase tracking-wide px-4 py-3">Kategoriler</h2>
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              <li>
                <button onClick={() => git({ kategori: null })} className={secimClass(kategori === null)}>
                  <span>Tüm kategoriler</span>
                </button>
              </li>
              {kategoriler.map((k) => (
                <li key={k.id}>
                  <button onClick={() => git({ kategori: k.id })} className={secimClass(kategori === k.id)}>
                    <span>
                      {k.icon} {k.kategori_adi}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Sağ: Liste */}
        <section className="flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-[#1a3a6b]">{baslik}</h1>
              <p className="text-sm text-gray-500">
                {bulunan > 0 ? `${bulunan} firmadan ${baslangic}–${bitis} gösteriliyor` : 'Firma bulunamadı'}
                {q && (
                  <>
                    {' '}
                    · &quot;{q}&quot;{' '}
                    <button onClick={() => git({ q: null })} className="text-[#2554a0] hover:underline">
                      aramayı temizle
                    </button>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-500 mr-1">Sayfada:</span>
              {SAYFA_BOYUTLARI.map((b) => (
                <button
                  key={b}
                  onClick={() => git({ limit: b })}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    limit === b ? 'bg-[#1a3a6b] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {yukleniyor ? (
            <div className="bg-white rounded-lg p-12 text-center text-gray-500">Yükleniyor...</div>
          ) : firmalar.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-600 font-semibold">Aramanıza uygun firma bulunamadı</p>
              <Link href="/firmalar" className="inline-block mt-3 text-[#2554a0] font-semibold hover:underline">
                Tüm firmaları göster
              </Link>
            </div>
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

          {sayfaSayisi > 1 && (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Sayfalar">
              <button
                onClick={() => git({ sayfa: sayfa - 1 })}
                disabled={sayfa === 1}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md font-semibold disabled:opacity-40"
              >
                ←
              </button>
              {numaralar.map((n, i) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - numaralar[i - 1] > 1 && <span className="text-gray-400">…</span>}
                  <button
                    onClick={() => git({ sayfa: n })}
                    className={`min-w-10 px-3 py-2 rounded-md font-semibold border ${
                      n === sayfa ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]' : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                </span>
              ))}
              <button
                onClick={() => git({ sayfa: sayfa + 1 })}
                disabled={sayfa >= sayfaSayisi}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md font-semibold disabled:opacity-40"
              >
                →
              </button>
              <span className="w-full text-center text-sm text-gray-500">
                Sayfa {sayfa} / {sayfaSayisi}
              </span>
            </nav>
          )}
        </section>
      </main>
    </>
  );
}
