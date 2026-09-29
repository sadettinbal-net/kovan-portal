import Link from 'next/link';
import { basHarfler, type AltKategori, type Kategori } from '@/lib/rehber';

// Yeni tasarımın firma kartı: turuncu şerit, büyük resim, ad, kategori, site, Detaylar
export default function FirmaKarti({
  firma,
  alt,
  ana,
  siteAdi,
}: {
  firma: any;
  alt?: AltKategori;
  ana?: Kategori;
  siteAdi?: string;
}) {
  const renk = ana?.renk || '#1a3a6b';
  return (
    <article className="bg-white rounded-lg border-2 border-[#e8a020] overflow-hidden flex flex-col hover:shadow-lg transition">
      <div className="bg-[#e8a020] text-white text-xs font-bold uppercase px-3 py-1.5 flex items-center gap-1.5">
        <span>{ana?.icon || '★'}</span>
        <span className="truncate">{ana?.kategori_adi || 'Firma'}</span>
      </div>
      <Link href={`/firma/${firma.id}`} className="relative block h-44 bg-gray-100">
        {firma.kart_resmi ? (
          <img src={firma.kart_resmi} alt={firma.dukkan_adi} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            style={{ background: `linear-gradient(135deg, ${renk}22, ${renk}55)` }}
          >
            {ana?.icon || '🏪'}
          </div>
        )}
        <span className="absolute bottom-2 right-2 bg-[#1a3a6b] text-white font-black text-lg tracking-widest px-2 py-0.5 rounded">
          {basHarfler(firma.dukkan_adi || '')}
        </span>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-black text-[#1a3a6b] uppercase leading-tight">{firma.dukkan_adi}</h3>
        <div className="mt-2 space-y-1 text-sm text-gray-600 flex-1">
          {(alt?.alt_kategori_adi || firma.kategori) && (
            <p className="uppercase">🏷️ {alt?.alt_kategori_adi || firma.kategori}</p>
          )}
          {siteAdi && <p>🏭 {siteAdi}</p>}
          {firma.usta_adi && <p>👤 {firma.usta_adi}</p>}
        </div>
        <Link
          href={`/firma/${firma.id}`}
          className="mt-4 block text-center bg-[#1a3a6b] hover:bg-[#0f2548] text-white font-semibold py-2.5 rounded-md transition"
        >
          Detaylar
        </Link>
      </div>
    </article>
  );
}
