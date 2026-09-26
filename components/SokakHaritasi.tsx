'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface SokakHaritasiProps {
  sokakAdi: string;
  mahalleAdi: string;
  ilceAdi: string;
  ilAdi: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function SokakHaritasi({
  sokakAdi,
  mahalleAdi,
  ilceAdi,
  ilAdi,
  latitude,
  longitude
}: SokakHaritasiProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof window === 'undefined') return;

    // Harita zaten varsa temizle
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const initMap = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Leaflet'i dinamik olarak yükle
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        // Marker icon fix
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        let lat: number;
        let lng: number;

        // Eğer koordinat verilmişse direkt kullan
        if (latitude && longitude) {
          lat = latitude;
          lng = longitude;
        } else {
          // Yoksa OpenStreetMap'ten ara
          const fullAddress = `${sokakAdi}, ${mahalleAdi}, ${ilceAdi}, ${ilAdi}, Türkiye`;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&addressdetails=1&limit=1&countrycodes=tr`
          );

          const data = await response.json();

          if (!data || data.length === 0) {
            throw new Error('Sokak haritada bulunamadı');
          }

          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        }

        // Harita oluştur
        const map = L.map(mapContainerRef.current).setView([lat, lng], 16);

        // OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Marker ekle
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`
          <div style="font-family: system-ui; padding: 4px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${sokakAdi}</div>
            <div style="font-size: 12px; color: #666;">
              ${mahalleAdi}, ${ilceAdi}<br/>
              ${ilAdi}
            </div>
          </div>
        `).openPopup();

        markerRef.current = marker;
        mapRef.current = map;
        setIsLoading(false);

      } catch (err: any) {
        setError(err.message || 'Harita yüklenemedi');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [sokakAdi, mahalleAdi, ilceAdi, ilAdi, latitude, longitude]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <div className="text-sm text-gray-600">Harita yükleniyor...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
          <div className="text-center p-6">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-sm text-red-600 font-medium">{error}</div>
            <div className="text-xs text-gray-500 mt-2">
              Bu sokak haritada bulunamadı
            </div>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
    </div>
  );
}
