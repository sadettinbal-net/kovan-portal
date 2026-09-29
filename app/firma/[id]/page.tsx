'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UstMenu from '@/components/site/UstMenu';
import AltBilgi from '@/components/site/AltBilgi';
import FirmaKarti from '@/components/site/FirmaKarti';
import { basHarfler, whatsappLinki } from '@/lib/rehber';

// Firma detay sayfası: resimler, bilgiler, hizmetler, iletişim düğmeleri, benzer firmalar
export default function FirmaDetayPage() {
  const { id } = useParams<{ id: string }>();
  const [firma, setFirma] = useState<any>(null);
  const [benzerler, setBenzerler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [buyukResim, setBuyukResim] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setYukleniyor(true);
      const { data: dukkan } = await supabase.from('dukkanlar').select('*').eq('id', parseInt(id)).maybeSingle();
      if (!dukkan) {
        setFirma(null);
        setYukleniyor(false);
        return;
      }

      // Kategori, sanayi sitesi, mahalle ve benzer firmalar (aynı alt kategori)
      const [altKatSonuc, siteSonuc, mahalleSonuc, benzerSonuc] = await Promise.all([
        dukkan.alt_kategori_id
          ? supabase.from('alt_kategoriler').select('id, alt_kategori_adi, kategori_id').eq('id', dukkan.alt_kategori_id).maybeSingle()
          : Promise.resolve({ data: null }),
        dukkan.site_id
          ? supabase.from('sanayi_siteleri').select('id, site_adi, il_adi, ilce_adi').eq('id', dukkan.site_id).maybeSingle()
          : Promise.resolve({ data: null }),
        dukkan.mahalle_id
          ? supabase.from('mahalleler_yeni').select('mahalle_adi').eq('mahalle_id', dukkan.mahalle_id).limit(1).maybeSingle()
          : Promise.resolve({ data: null }),
        dukkan.alt_kategori_id
          ? supabase
              .from('dukkanlar')
              .select('*')
              .eq('alt_kategori_id', dukkan.alt_kategori_id)
              .neq('id', dukkan.id)
              .order('kart_resmi', { ascending: true, nullsFirst: false })
              .limit(3)
          : Promise.resolve({ data: [] }),
      ]);
      const altKat: any = altKatSonuc.data;
      const anaKat = altKat
        ? (await supabase.from('kategoriler').select('id, kategori_adi, icon, renk').eq('id', altKat.kategori_id).maybeSingle()).data
        : null;

      setFirma({ ...dukkan, altKat, anaKat, site: siteSonuc.data, mahalle: (mahalleSonuc.data as any)?.mahalle_adi });
      setBenzerler(benzerSonuc.data || []);
      setYukleniyor(false);
    })();
  }, [id]);

  const icerik = () => {
    if (yukleniyor) {
      return <div className="py-24 text-center text-gray-500">Yükleniyor...</div>;
    }
    if (!firma) {
      return (
        <div className="py-24 flex flex-col items-center gap-4 text-center">
          <div className="text-6xl">🔍</div>
          <p className="text-gray-700 font-bold">Firma bulunamadı</p>
          <Link href="/firmalar" className="text-[#2554a0] font-bold hover:underline">
            ← Firmalara dön
          </Link>
        </div>
      );
    }

    const hizmetler: string[] = (firma.hizmetler || '')
      .split(',')
      .map((h: string) => h.trim())
      .filter(Boolean);
    const ilIlce = [firma.site?.ilce_adi, firma.site?.il_adi].filter(Boolean).join(' / ');
    const haritaAramasi = [firma.dukkan_adi, firma.adres, firma.site?.site_adi, ilIlce].filter(Boolean).join(' ');
    const bilgiler: [string, React.ReactNode][] = [
      ['Kategori', [firma.anaKat?.kategori_adi, firma.altKat?.alt_kategori_adi].filter(Boolean).join(' › ')],
      [
        'Sanayi Sitesi',
        firma.site && (
          <Link href={`/firmalar?site=${firma.site.id}`} className="text-[#2554a0] hover:underline">
            {firma.site.site_adi}
          </Link>
        ),
      ],
      ['İl / İlçe', ilIlce],
      ['Mahalle', firma.mahalle],
      ['Blok / No', firma.blok_no],
      ['Adres', firma.adres],
      ['Yetkili', firma.usta_adi],
      ['Telefon', firma.telefon && <a href={`tel:${firma.telefon}`} className="text-[#2554a0] hover:underline">{firma.telefon}</a>],
      ['Cep Telefonu', firma.cep_telefonu && <a href={`tel:${firma.cep_telefonu}`} className="text-[#2554a0] hover:underline">{firma.cep_telefonu}</a>],
      [
        'Web Sitesi',
        firma.web_sitesi && (
          <a href={firma.web_sitesi} target="_blank" rel="noopener noreferrer" className="text-[#2554a0] hover:underline break-all">
            {firma.web_sitesi}
          </a>
        ),
      ],
    ];
    const renk = firma.anaKat?.renk || '#1a3a6b';

    return (
      <>
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/yeni-tasarim" className="hover:text-[#1a3a6b]">Anasayfa</Link>
          <span className="mx-2">›</span>
          <Link href="/firmalar" className="hover:text-[#1a3a6b]">Firmalar</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-800 font-medium">{firma.dukkan_adi}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sol: resimler ve bilgiler */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border-2 border-[#e8a020]">
              <div className="bg-[#e8a020] text-white text-xs font-bold uppercase px-3 py-1.5 flex items-center gap-1.5">
                <span>{firma.anaKat?.icon || '★'}</span>
                <span>{firma.anaKat?.kategori_adi || 'Firma'}</span>
              </div>
              <button
                type="button"
                onClick={() => firma.kart_resmi && setBuyukResim(firma.kart_resmi)}
                className="relative block w-full h-64 sm:h-80 bg-gray-100"
              >
                {firma.kart_resmi ? (
                  <img src={firma.kart_resmi} alt={firma.dukkan_adi} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-8xl"
                    style={{ background: `linear-gradient(135deg, ${renk}22, ${renk}55)` }}
                  >
                    {firma.anaKat?.icon || '🏪'}
                  </div>
                )}
                <span className="absolute bottom-3 right-3 bg-[#1a3a6b] text-white font-black text-2xl tracking-widest px-3 py-1 rounded">
                  {basHarfler(firma.dukkan_adi || '')}
                </span>
              </button>
              {firma.fotograflar?.length > 0 && (
                <div className="grid grid-cols-5 gap-2 p-3">
                  {firma.fotograflar.map((url: string, i: number) => (
                    <button key={url} type="button" onClick={() => setBuyukResim(url)}>
                      <img
                        src={url}
                        alt={`${firma.dukkan_adi} fotoğraf ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-md border border-gray-200 hover:opacity-90 transition"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-black text-[#1a3a6b] uppercase">{firma.dukkan_adi}</h1>
              <dl className="mt-4 divide-y divide-gray-100 text-sm">
                {bilgiler
                  .filter(([, deger]) => deger)
                  .map(([etiket, deger]) => (
                    <div key={etiket} className="grid grid-cols-3 gap-3 py-2.5">
                      <dt className="font-semibold text-gray-500">{etiket}</dt>
                      <dd className="col-span-2 text-gray-800">{deger}</dd>
                    </div>
                  ))}
              </dl>
            </div>

            {hizmetler.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#1a3a6b] mb-3">🔧 Sunduğu Hizmetler</h2>
                <div className="flex flex-wrap gap-2">
                  {hizmetler.map((h) => (
                    <span key={h} className="bg-[#eaf3ff] text-[#1a3a6b] text-sm font-semibold px-3 py-1.5 rounded-md">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sağ: iletişim düğmeleri */}
          <aside className="space-y-3 lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <h2 className="font-bold text-[#1a3a6b]">İletişime Geç</h2>
              {(firma.cep_telefonu || firma.telefon) && (
                <a
                  href={`tel:${firma.cep_telefonu || firma.telefon}`}
                  className="flex items-center justify-center gap-2 w-full bg-[#1a3a6b] hover:bg-[#0f2548] text-white font-bold py-3 rounded-md transition"
                >
                  📞 Hemen Ara
                </a>
              )}
              {firma.whatsapp && (
                <a
                  href={whatsappLinki(firma.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#16a34a] hover:bg-green-700 text-white font-bold py-3 rounded-md transition"
                >
                  💬 WhatsApp
                </a>
              )}
              {firma.web_sitesi && (
                <a
                  href={firma.web_sitesi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-white border-2 border-[#dde3ec] hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-md transition"
                >
                  🌐 Web Sitesi
                </a>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(haritaAramasi)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#2554a0] hover:bg-[#1a3a6b] text-white font-bold py-3 rounded-md transition"
              >
                🗺️ Yol Tarifi
              </a>
              {firma.site && (
                <Link
                  href={`/firmalar?site=${firma.site.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-[#e8a020] hover:bg-[#c8851a] text-white font-bold py-3 rounded-md transition"
                >
                  🏭 Sitedeki Diğer Firmalar
                </Link>
              )}
            </div>
          </aside>
        </div>

        {benzerler.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-[#1a3a6b] mb-4">Benzer Firmalar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {benzerler.map((b) => (
                <FirmaKarti key={b.id} firma={b} alt={firma.altKat} ana={firma.anaKat} />
              ))}
            </div>
          </section>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-gray-800">
      <UstMenu />
      <main className="max-w-7xl mx-auto px-4 py-6">{icerik()}</main>
      <AltBilgi />

      {buyukResim && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setBuyukResim(null)}>
          <img src={buyukResim} alt="" className="max-w-full max-h-full rounded-lg" />
          <button type="button" aria-label="Kapat" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white text-xl hover:bg-white/30">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
