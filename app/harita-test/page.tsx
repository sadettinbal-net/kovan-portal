'use client';

import { useState } from 'react';
import OpenStreetMap from '@/components/OpenStreetMap';

export default function HaritaTest() {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedLocation({ lat, lng, address });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          OpenStreetMap Test Sayfası
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Harita */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-[600px]">
              <OpenStreetMap
                initialCenter={[39.9334, 32.8597]} // Ankara
                initialZoom={12}
                onLocationSelect={handleLocationSelect}
              />
            </div>
          </div>

          {/* Bilgi Paneli */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Seçili Konum
            </h2>

            {selectedLocation ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Enlem (Latitude)
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {selectedLocation.lat.toFixed(6)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Boylam (Longitude)
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {selectedLocation.lng.toFixed(6)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Adres
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {selectedLocation.address}
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${selectedLocation.lat}, ${selectedLocation.lng}`
                    );
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Koordinatları Kopyala
                </button>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Harita üzerinde bir nokta seçin veya arama yapın.
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Nasıl Kullanılır?
              </h3>
              <ul className="text-xs text-gray-600 space-y-2">
                <li>• Harita üzerine tıklayarak konum seçin</li>
                <li>• Arama kutusuna adres, sokak veya mahalle yazın</li>
                <li>• Haritayı yakınlaştırmak için scroll yapın</li>
                <li>• Haritayı sürükleyerek gezinin</li>
              </ul>
            </div>

            <div className="mt-6 p-3 bg-blue-50 rounded-md">
              <div className="text-xs text-blue-800">
                © OpenStreetMap contributors
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Veriler ODbL lisansı altında kullanılmaktadır.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
