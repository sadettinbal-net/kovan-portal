'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OpenStreetMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
}

export default function OpenStreetMap({
  initialCenter = [39.9334, 32.8597], // Ankara merkez
  initialZoom = 6,
  onLocationSelect
}: OpenStreetMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Harita oluştur
    const map = L.map(mapContainerRef.current).setView(initialCenter, initialZoom);

    // OpenStreetMap tile layer ekle
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Harita tıklama olayı
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;

      // Marker ekle/güncelle
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      // Reverse geocoding - koordinattan adres bul
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();
        const address = data.display_name || 'Adres bulunamadı';

        markerRef.current?.bindPopup(address).openPopup();

        if (onLocationSelect) {
          onLocationSelect(lat, lng, address);
        }
      } catch (error) {
        console.error('Adres bulunamadı:', error);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom, onLocationSelect]);

  // Adres arama fonksiyonu
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=10&countrycodes=tr`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Arama sonucuna git
  const goToLocation = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 15);

      // Marker ekle/güncelle
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      } else {
        markerRef.current = L.marker([lat, lon]).addTo(mapRef.current);
      }

      markerRef.current?.bindPopup(result.display_name).openPopup();

      if (onLocationSelect) {
        onLocationSelect(lat, lon, result.display_name);
      }
    }

    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="w-full h-full relative">
      {/* Arama Kutusu */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 w-80">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Adres, sokak, mahalle ara..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isSearching ? '...' : 'Ara'}
          </button>
        </div>

        {/* Arama Sonuçları */}
        {searchResults.length > 0 && (
          <div className="mt-2 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-md">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => goToLocation(result)}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-800">
                  {result.display_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {result.type} • {result.address?.city || result.address?.town || result.address?.county}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Harita Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
