'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import UyelikMenusu from '@/components/UyelikMenusu';

// Yeni ana sayfa tasarımı (önizleme): lacivert üst menü, arama, solda sanayi siteleri, sağda firma kartları
const SAYFA_BOYUTU = 24;

type Site = { id: number; site_adi: string; il_adi?: string; ilce_adi?: string; sayi: number };

function basHarfler(ad: string) {
  return ad
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0])
    .join('')
    .toLocaleUpperCase('tr-TR');
}

export default function YeniTasarimPage() {
  const [toplamFirma, setToplamFirma] = useState(0);
  const [siteler, setSiteler] = useState<Site[]>([]);
  const [kategoriler, setKategoriler] = useState<Map<number, any>>(new Map());
  const [altKategoriler, setAltKategoriler] = useState<Map<number, any>>(new Map());
  const [seciliSite, setSeciliSite] = useState<number | null>(null);
  const [aramaKutusu, setAramaKutusu] = useState('');
  const [arama, setArama] = useState('');
  const [firmalar, setFirmalar] = useState<any[]>([]);
  const [bulunan, setBulunan] = useState(0);
  const [sayfa, setSayfa] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [menuAcik, setMenuAcik] = useState(false);

  // Sabit veriler: toplam firma, sanayi siteleri (firma sayılarıyla), kategoriler
  useEffect(() => {
    (async () => {
      const [{ count }, { data: siteData }, { data: firmaSiteleri }, { data: katData }, { data: altData }] =
        await Promise.all([
          supabase.from('dukkanlar').select('*', { count: 'exact', head: true }),
          supabase.from('sanayi_siteleri').select('id, site_adi, il_adi, ilce_adi'),
          supabase.from('dukkanlar').select('site_id').not('site_id', 'is', null),
          supabase.from('kategoriler').select('id, kategori_adi, icon, renk'),
          supabase.from('alt_kategoriler').select('id, alt_kategori_adi, kategori_id'),
        ]);
      setToplamFirma(count || 0);
      setKategoriler(new Map((katData || []).map((k) => [k.id, k])));
      setAltKategoriler(new Map((altData || []).map((a) => [a.id, a])));

      // Her sanayi sitesindeki firma sayısı; en kalabalık siteler üstte
      const sayilar = new Map<number, number>();
      for (const f of firmaSiteleri || []) sayilar.set(f.site_id, (sayilar.get(f.site_id) || 0) + 1);
      setSiteler(
        (siteData || [])
          .map((s) => ({ ...s, sayi: sayilar.get(s.id) || 0 }))
          .sort((a, b) => b.sayi - a.sayi || a.site_adi.localeCompare(b.site_adi, 'tr'))
      );
    })();
  }, []);

  // Firma listesi: seçili site + arama + sayfa
  useEffect(() => {
    (async () => {
      setYukleniyor(true);
      let sorgu = supabase
        .from('dukkanlar')
        .select('*', { count: 'exact' })
        .order('kart_resmi', { ascending: true, nullsFirst: false })
        .order('dukkan_adi')
        .range(sayfa * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU + SAYFA_BOYUTU - 1);
      if (seciliSite) sorgu = sorgu.eq('site_id', seciliSite);
      const temiz = arama.replace(/[,()%]/g, ' ').trim();
      if (temiz) {
        sorgu = sorgu.or(
          `dukkan_adi.ilike.%${temiz}%,usta_adi.ilike.%${temiz}%,kategori.ilike.%${temiz}%,hizmetler.ilike.%${temiz}%`
        );
      }
      const { data, count } = await sorgu;
      setFirmalar(data || []);
      setBulunan(count || 0);
      setYukleniyor(false);
    })();
  }, [seciliSite, arama, sayfa]);

  const siteAdi = useMemo(() => new Map(siteler.map((s) => [s.id, s.site_adi])), [siteler]);
  const sayfaSayisi = Math.max(1, Math.ceil(bulunan / SAYFA_BOYUTU));

  const aramaYap = (e: React.FormEvent) => {
    e.preventDefault();
    setSayfa(0);
    setArama(aramaKutusu);
  };

  const siteSec = (id: number | null) => {
    setSeciliSite(id);
    setSayfa(0);
    document.getElementById('firmalar')?.scrollIntoView({ behavior: 'smooth' });
  };

  const menu = [
    { ad: 'Anasayfa', href: '/yeni-tasarim' },
    { ad: 'Firmalar', href: '#firmalar' },
    { ad: 'Konuma Göre Ara', href: '/' },
    { ad: 'Firma Ekle', href: '/firma-ekle' },
    { ad: 'İletişim', href: '#iletisim' },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-gray-800">
      {/* Üst menü */}
      <header className="bg-[#1e3a5f] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/yeni-tasarim" className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shrink-0">
            <span className="text-2xl">🐝</span>
            <span className="leading-none">
              <span className="block font-black text-[#1e3a5f] tracking-tight">KOVAN PORTAL</span>
              <span className="block text-[10px] font-bold text-amber-600">SANAYİ REHBERİ</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {menu.map((m) => (
              <Link
                key={m.ad}
                href={m.href}
                className="px-3 py-2 text-[15px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                {m.ad}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-[#16304f] text-white text-sm font-bold px-3 py-1.5 rounded-lg">
              🇹🇷 TR
            </span>
            <UyelikMenusu koyu />
          </div>

          <button
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg"
            onClick={() => setMenuAcik(!menuAcik)}
            aria-label="Menü"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {menuAcik && (
          <div className="lg:hidden border-t border-white/10 px-4 py-3 space-y-1">
            {menu.map((m) => (
              <Link
                key={m.ad}
                href={m.href}
                onClick={() => setMenuAcik(false)}
                className="block px-3 py-2 font-semibold text-white/90 hover:bg-white/10 rounded-lg"
              >
                {m.ad}
              </Link>
            ))}
            <div className="pt-2">
              <UyelikMenusu koyu />
            </div>
          </div>
        )}
      </header>

      {/* Arama */}
      <section className="bg-[#1e3a5f] pb-10 pt-8 px-4 text-center">
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
            className="flex-1 min-w-0 h-14 px-5 rounded-lg text-gray-800 placeholder-gray-400 outline-none focus:ring-4 focus:ring-amber-400/50"
          />
          <button
            type="submit"
            className="h-14 px-6 sm:px-8 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-lg transition flex items-center gap-2"
          >
            🔍 <span className="hidden sm:inline">Ara</span>
          </button>
        </form>
      </section>

      {/* İçerik */}
      <main id="firmalar" className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 scroll-mt-20">
        {/* Sol: Sanayi siteleri */}
        <aside className="md:w-56 lg:w-64 shrink-0">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden md:sticky md:top-24">
            <h2 className="bg-[#1e3a5f] text-white text-sm font-bold uppercase tracking-wide px-4 py-3">
              Sanayi Siteleri
            </h2>
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              <li>
                <button
                  onClick={() => siteSec(null)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm transition ${
                    seciliSite === null ? 'bg-blue-50 font-bold text-[#1e3a5f]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span>Tümü</span>
                  <span className="bg-[#1e3a5f] text-white text-xs font-bold px-2 py-0.5 rounded-full">{toplamFirma}</span>
                </button>
              </li>
              {siteler.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => siteSec(s.id)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm transition ${
                      seciliSite === s.id ? 'bg-blue-50 font-bold text-[#1e3a5f]' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{s.site_adi}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        seciliSite === s.id ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {s.sayi}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Sağ: Firma kartları */}
        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
              <span className="text-amber-500">★</span>
              {seciliSite ? siteAdi.get(seciliSite) : 'Firmalar'}
            </h2>
            <span className="text-sm text-gray-500">{bulunan} firma</span>
          </div>

          {yukleniyor ? (
            <div className="bg-white rounded-lg p-12 text-center text-gray-500">Yükleniyor...</div>
          ) : firmalar.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center text-gray-500">Aramanıza uygun firma bulunamadı</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {firmalar.map((f) => {
                const alt = altKategoriler.get(f.alt_kategori_id);
                const ana = alt ? kategoriler.get(alt.kategori_id) : null;
                return (
                  <article
                    key={f.id}
                    className="bg-white rounded-lg border-2 border-amber-400 overflow-hidden flex flex-col hover:shadow-lg transition"
                  >
                    <div className="bg-amber-500 text-white text-xs font-bold uppercase px-3 py-1.5 flex items-center gap-1.5">
                      <span>{ana?.icon || '★'}</span>
                      <span className="truncate">{ana?.kategori_adi || 'Firma'}</span>
                    </div>
                    <Link href={`/firma/${f.id}`} className="relative block h-44 bg-gray-100">
                      {f.kart_resmi ? (
                        <img src={f.kart_resmi} alt={f.dukkan_adi} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-6xl"
                          style={{ background: `linear-gradient(135deg, ${ana?.renk || '#1e3a5f'}22, ${ana?.renk || '#1e3a5f'}55)` }}
                        >
                          {ana?.icon || '🏪'}
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2 bg-[#1e3a5f] text-white font-black text-lg tracking-widest px-2 py-0.5 rounded">
                        {basHarfler(f.dukkan_adi || '')}
                      </span>
                    </Link>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-black text-[#1e3a5f] uppercase leading-tight">{f.dukkan_adi}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600 flex-1">
                        {(alt?.alt_kategori_adi || f.kategori) && (
                          <p className="uppercase">🏷️ {alt?.alt_kategori_adi || f.kategori}</p>
                        )}
                        {f.site_id && siteAdi.get(f.site_id) && <p>🏭 {siteAdi.get(f.site_id)}</p>}
                        {f.usta_adi && <p>👤 {f.usta_adi}</p>}
                      </div>
                      <Link
                        href={`/firma/${f.id}`}
                        className="mt-4 block text-center bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold py-2.5 rounded-md transition"
                      >
                        Detaylar
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {sayfaSayisi > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setSayfa(sayfa - 1)}
                disabled={sayfa === 0}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold disabled:opacity-40"
              >
                ← Önceki
              </button>
              <span className="text-sm text-gray-600">
                {sayfa + 1} / {sayfaSayisi}
              </span>
              <button
                onClick={() => setSayfa(sayfa + 1)}
                disabled={sayfa + 1 >= sayfaSayisi}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold disabled:opacity-40"
              >
                Sonraki →
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Alt bilgi */}
      <footer id="iletisim" className="bg-[#1e3a5f] text-white/80 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-8 grid gap-6 sm:grid-cols-3 text-sm">
          <div>
            <p className="font-black text-white text-lg">🐝 KOVAN PORTAL</p>
            <p className="mt-2">Türkiye&apos;nin sanayi rehberi. Ustalara ve sanayi firmalarına kolayca ulaşın.</p>
          </div>
          <div>
            <p className="font-bold text-white mb-2">Hızlı Erişim</p>
            <ul className="space-y-1">
              <li><Link href="/firma-ekle" className="hover:text-white">Firma Ekle</Link></li>
              <li><Link href="/uye-ol" className="hover:text-white">Üye Ol</Link></li>
              <li><Link href="/" className="hover:text-white">Konuma Göre Ara</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-white mb-2">İletişim</p>
            <p>Bilgiler yakında eklenecek.</p>
          </div>
        </div>
        <div className="bg-[#16304f] text-center text-xs py-3">© {new Date().getFullYear()} Kovan Portal</div>
      </footer>
    </div>
  );
}
