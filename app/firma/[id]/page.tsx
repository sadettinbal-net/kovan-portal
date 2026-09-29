'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function whatsappLinki(numara: string) {
  let rakamlar = numara.replace(/\D/g, '');
  if (rakamlar.startsWith('0')) rakamlar = rakamlar.slice(1);
  if (rakamlar.length === 10) rakamlar = '90' + rakamlar;
  return `https://wa.me/${rakamlar}`;
}

// Firma detay sayfası: kart resmi, hizmetler, detay fotoğrafları ve iletişim
export default function FirmaDetayPage() {
  const { id } = useParams<{ id: string }>();
  const [firma, setFirma] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [buyukResim, setBuyukResim] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: dukkan } = await supabase.from('dukkanlar').select('*').eq('id', parseInt(id)).maybeSingle();
      if (!dukkan) {
        setYukleniyor(false);
        return;
      }

      // Kategori ve sanayi sitesi bilgisini ayrı çek (ana sayfadaki gibi)
      const [altKatSonuc, siteSonuc] = await Promise.all([
        dukkan.alt_kategori_id
          ? supabase.from('alt_kategoriler').select('alt_kategori_adi, kategori_id').eq('id', dukkan.alt_kategori_id).maybeSingle()
          : Promise.resolve({ data: null }),
        dukkan.site_id
          ? supabase.from('sanayi_siteleri').select('site_adi, il_adi, ilce_adi').eq('id', dukkan.site_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const altKat: any = altKatSonuc.data;
      const anaKat = altKat
        ? (await supabase.from('kategoriler').select('kategori_adi, icon, renk').eq('id', altKat.kategori_id).maybeSingle()).data
        : null;

      setFirma({ ...dukkan, altKat, anaKat, site: siteSonuc.data });
      setYukleniyor(false);
    })();
  }, [id]);

  if (yukleniyor) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Yükleniyor...</div>;
  }

  if (!firma) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="text-6xl">🔍</div>
        <p className="text-gray-700 font-bold">Firma bulunamadı</p>
        <Link href="/" className="text-yellow-700 font-bold hover:underline">
          ← Anasayfaya dön
        </Link>
      </div>
    );
  }

  const hizmetler: string[] = (firma.hizmetler || '')
    .split(',')
    .map((h: string) => h.trim())
    .filter(Boolean);
  const konum = [
    firma.site?.site_adi,
    [firma.site?.ilce_adi, firma.site?.il_adi].filter(Boolean).join(' / '),
    firma.blok_no,
    firma.adres,
  ]
    .filter(Boolean)
    .join(' • ');
  const haritaAramasi = [firma.dukkan_adi, firma.site?.site_adi, firma.site?.ilce_adi, firma.site?.il_adi]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4">
      <div className="max-w-3xl mx-auto">
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-yellow-700">
            Anasayfa
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-800 font-medium">{firma.dukkan_adi}</span>
        </nav>

        <div className="bg-white/90 rounded-3xl shadow-xl border-2 border-yellow-400/30 overflow-hidden">
          {firma.kart_resmi && (
            <button type="button" onClick={() => setBuyukResim(firma.kart_resmi)} className="block w-full">
              <img src={firma.kart_resmi} alt={firma.dukkan_adi} className="w-full h-56 sm:h-72 object-cover" />
            </button>
          )}

          <div className="p-6 space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <h1 className="text-2xl font-black text-gray-800 uppercase leading-tight">{firma.dukkan_adi}</h1>
                {firma.usta_adi && <p className="mt-1 text-gray-600 font-bold">👤 {firma.usta_adi}</p>}
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                {firma.anaKat && (
                  <span
                    style={{ backgroundColor: firma.anaKat.renk }}
                    className="text-white text-xs px-3 py-1.5 rounded-xl font-black uppercase shadow-md flex items-center gap-1.5"
                  >
                    <span>{firma.anaKat.icon}</span>
                    <span>{firma.anaKat.kategori_adi}</span>
                  </span>
                )}
                {firma.altKat && (
                  <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-lg font-bold">
                    {firma.altKat.alt_kategori_adi}
                  </span>
                )}
              </div>
            </div>

            {konum && <p className="text-sm text-gray-600">📍 {konum}</p>}

            {hizmetler.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Sunduğu Hizmetler</h2>
                <div className="flex flex-wrap gap-2">
                  {hizmetler.map((h) => (
                    <span key={h} className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1.5 rounded-xl">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {firma.fotograflar?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Fotoğraflar</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {firma.fotograflar.map((url: string, i: number) => (
                    <button key={url} type="button" onClick={() => setBuyukResim(url)} className="block">
                      <img
                        src={url}
                        alt={`${firma.dukkan_adi} fotoğraf ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-2xl border border-gray-200 hover:opacity-90 transition"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {firma.telefon && (
                <a
                  href={`tel:${firma.telefon}`}
                  className="flex items-center justify-center w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 rounded-2xl font-bold gap-2 hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg"
                >
                  <span className="text-xl">📞</span>
                  <span>{firma.telefon}</span>
                </a>
              )}
              {firma.cep_telefonu && (
                <a
                  href={`tel:${firma.cep_telefonu}`}
                  className="flex items-center justify-center w-full bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 rounded-2xl font-bold gap-2 hover:from-slate-600 hover:to-slate-700 transition-all shadow-lg"
                >
                  <span className="text-xl">📱</span>
                  <span>{firma.cep_telefonu}</span>
                </a>
              )}
              {firma.whatsapp && (
                <a
                  href={whatsappLinki(firma.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-2xl font-bold gap-2 hover:from-green-400 hover:to-green-500 transition-all shadow-lg"
                >
                  <span className="text-xl">💬</span>
                  <span>WhatsApp&apos;tan Yaz</span>
                </a>
              )}
              {firma.web_sitesi && (
                <a
                  href={firma.web_sitesi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-white border-2 border-gray-300 text-gray-700 p-4 rounded-2xl font-bold gap-2 hover:bg-gray-50 transition-all"
                >
                  <span className="text-xl">🌐</span>
                  <span>Web Sitesi</span>
                </a>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(haritaAramasi)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-2xl font-bold gap-2 hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg"
              >
                <span className="text-xl">🗺️</span>
                <span>Google Maps&apos;te Aç</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Büyük resim */}
      {buyukResim && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setBuyukResim(null)}
        >
          <img src={buyukResim} alt="" className="max-w-full max-h-full rounded-2xl" />
          <button
            type="button"
            aria-label="Kapat"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white text-xl hover:bg-white/30"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
