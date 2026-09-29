'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Bir yeri OpenStreetMap'te (Nominatim) arayıp haritada gösterir. Veritabanında koordinat olmadığı için
// en ayrıntılı adresten başlayıp bulunana kadar daha genel adreslere iner (sokak → mahalle → ilçe → il).
export type HaritaSorgusu = { adres: string; yakinlik: number };

const ONBELLEK = new Map<string, { lat: number; lng: number } | null>();

async function adresBul(adres: string) {
  if (ONBELLEK.has(adres)) return ONBELLEK.get(adres)!;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tr&q=${encodeURIComponent(adres)}`,
    { headers: { 'Accept-Language': 'tr' } }
  );
  const data = res.ok ? await res.json() : [];
  const sonuc = data?.[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
  ONBELLEK.set(adres, sonuc);
  return sonuc;
}

export default function BolgeHaritasi({
  sorgular,
  etiket,
  yukseklik = 320,
}: {
  sorgular: HaritaSorgusu[];
  etiket: string;
  yukseklik?: number;
}) {
  const kutu = useRef<HTMLDivElement>(null);
  const [durum, setDurum] = useState<'yukleniyor' | 'hazir' | 'bulunamadi'>('yukleniyor');
  const anahtar = sorgular.map((s) => s.adres).join('|');

  useEffect(() => {
    let iptal = false;
    let harita: import('leaflet').Map | null = null;

    (async () => {
      setDurum('yukleniyor');
      const L = (await import('leaflet')).default;

      let bulunan: { lat: number; lng: number; yakinlik: number } | null = null;
      for (const s of sorgular) {
        try {
          const konum = await adresBul(s.adres);
          if (konum) {
            bulunan = { ...konum, yakinlik: s.yakinlik };
            break;
          }
        } catch {
          // Ağ hatası: bir sonraki (daha genel) adresi dene
        }
      }
      if (iptal || !kutu.current) return;
      if (!bulunan) return setDurum('bulunamadi');

      harita = L.map(kutu.current, { scrollWheelZoom: false }).setView([bulunan.lat, bulunan.lng], bulunan.yakinlik);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(harita);
      L.circleMarker([bulunan.lat, bulunan.lng], {
        radius: 10,
        color: '#1a3a6b',
        weight: 3,
        fillColor: '#e8a020',
        fillOpacity: 0.9,
      })
        .addTo(harita)
        .bindPopup(etiket)
        .openPopup();
      setDurum('hazir');
    })();

    return () => {
      iptal = true;
      harita?.remove();
    };
    // sorgular her çizimde yeni dizi; içerik değişince yeniden çiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anahtar, etiket]);

  const haritaLinki = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sorgular[0]?.adres || '')}`;

  return (
    <div className="bg-white rounded-xl border border-[#dde3ec] overflow-hidden">
      <div className="relative" style={{ height: yukseklik }}>
        <div ref={kutu} className="absolute inset-0 z-0" />
        {durum !== 'hazir' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-sm text-gray-500">
            {durum === 'yukleniyor' ? 'Harita yükleniyor...' : 'Bu konum haritada bulunamadı.'}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-gray-500 border-t border-[#dde3ec]">
        <span>Konum yaklaşıktır.</span>
        <a href={haritaLinki} target="_blank" rel="noopener noreferrer" className="text-[#2554a0] font-semibold hover:underline">
          Google Haritalar&apos;da aç →
        </a>
      </div>
    </div>
  );
}
