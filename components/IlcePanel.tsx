'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface IlcePanelProps {
  isOpen: boolean;
  ilAdi: string;
  ilceSayisi: number;
  mahalleSayisi: number;
  onClose: () => void;
  onIlceClick?: (ilceAdi: string) => void;
}

interface Ilce {
  ilce_adi: string;
  mahalle_sayisi: number;
}

interface Mahalle {
  mahalle_adi: string;
}

export default function IlcePanel({ isOpen, ilAdi, ilceSayisi, mahalleSayisi, onClose, onIlceClick }: IlcePanelProps) {
  const [ilceler, setIlceler] = useState<Ilce[]>([]);
  const [mahalleler, setMahalleler] = useState<Mahalle[]>([]);
  const [seciliIlce, setSeciliIlce] = useState<string>('');
  const [yukluyor, setYukluyor] = useState(false);

  // İlçeleri yükle
  useEffect(() => {
    if (isOpen && ilAdi && !seciliIlce) {
      loadIlceler();
    }
  }, [isOpen, ilAdi, seciliIlce]);

  const loadIlceler = async () => {
    setYukluyor(true);
    try {
      const ilAdiUpper = ilAdi.toLocaleUpperCase('tr-TR');

      // Mahalleler tablosundan ilçeleri getir
      const { data: mahallelerData } = await supabase
        .from('mahalleler')
        .select('ilce_adi')
        .eq('il_adi', ilAdiUpper);

      // Mahalle sayılarını hesapla ve unique ilçeleri bul
      const mahalleSayilari = new Map<string, number>();
      mahallelerData?.forEach((m: any) => {
        const ilceAdi = m.ilce_adi?.toString().trim();
        if (ilceAdi) {
          mahalleSayilari.set(ilceAdi, (mahalleSayilari.get(ilceAdi) || 0) + 1);
        }
      });

      // İlçe listesini oluştur (unique ilçeler ve mahalle sayıları ile)
      const ilcelerWithCount = Array.from(mahalleSayilari.entries())
        .map(([ilce_adi, mahalle_sayisi]) => ({
          ilce_adi,
          mahalle_sayisi,
        }))
        .sort((a, b) => a.ilce_adi.localeCompare(b.ilce_adi));

      setIlceler(ilcelerWithCount);
    } catch (error) {
      console.error('İlçeler yüklenirken hata:', error);
    } finally {
      setYukluyor(false);
    }
  };

  const loadMahalleler = async (ilceAdi: string) => {
    setYukluyor(true);
    try {
      const ilAdiUpper = ilAdi.toLocaleUpperCase('tr-TR');

      const { data: mahallelerData } = await supabase
        .from('mahalleler')
        .select('mahalle_adi')
        .eq('il_adi', ilAdiUpper)
        .eq('ilce_adi', ilceAdi)
        .order('mahalle_adi');

      setMahalleler(mahallelerData?.map((m: any) => ({ mahalle_adi: m.mahalle_adi })) || []);
      setSeciliIlce(ilceAdi);

      // İlçe seçildiğinde parent'a bildir (harita için zoom)
      if (onIlceClick) {
        onIlceClick(ilceAdi);
      }
    } catch (error) {
      console.error('Mahalleler yüklenirken hata:', error);
    } finally {
      setYukluyor(false);
    }
  };

  const handleBack = () => {
    setSeciliIlce('');
    setMahalleler([]);

    // Geri dönerken haritayı normal zoom'a getir
    if (onIlceClick) {
      onIlceClick(''); // Boş string = ilçe seçimi iptal
    }
  };

  const handleClose = () => {
    setSeciliIlce('');
    setMahalleler([]);
    setIlceler([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
        onClick={handleClose}
      />

      {/* Panel - Petek rengi arka plan */}
      <div
        className="border-2 border-amber-900 rounded-xl shadow-2xl flex flex-col"
        style={{
          position: 'fixed',
          zIndex: 9999,
          width: '240px',
          height: '360px',
          left: '38%',
          top: '63%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(to bottom right, #f59e0b, #d97706)'
        }}
      >

        {/* Header - Daha kompakt */}
        <div className="flex items-center justify-between px-1 py-1.5 border-b border-amber-200/80 bg-gradient-to-r from-amber-100/50 to-orange-100/50">
          {seciliIlce ? (
            <button
              onClick={handleBack}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-amber-200/50 transition-colors text-amber-900 font-bold text-base"
              aria-label="Geri"
            >
              ←
            </button>
          ) : (
            <div className="w-6" />
          )}

          <span className="font-semibold text-amber-900 text-sm whitespace-nowrap px-1">
            {seciliIlce ? seciliIlce : `${ilAdi} (${ilceSayisi} ilçe)`}
          </span>

          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-amber-200/50 transition-colors text-amber-900 font-bold text-base leading-none"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        {/* Body - Kompakt */}
        <div className="flex-1 overflow-y-auto p-1">
          {yukluyor ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : seciliIlce ? (
            // Mahalle listesi - Tüm satırlar aynı genişlik
            <div className="space-y-1.5 inline-flex flex-col">
              {mahalleler.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">Mahalle bulunamadı</p>
              ) : (
                mahalleler.map((mahalle, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1 rounded bg-amber-100/80 border border-amber-300/60 hover:bg-amber-200/80 transition-all text-gray-800 whitespace-nowrap"
                    style={{ fontSize: '11px' }}
                  >
                    {mahalle.mahalle_adi}
                  </div>
                ))
              )}
            </div>
          ) : (
            // İlçe listesi - Tüm satırlar aynı genişlik
            <div className="space-y-1.5 inline-flex flex-col">
              {ilceler.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">İlçe bulunamadı</p>
              ) : (
                ilceler.map((ilce, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadMahalleler(ilce.ilce_adi)}
                    className="px-2.5 py-1 rounded bg-amber-100/80 border border-amber-300/60 hover:bg-amber-200/80 hover:border-amber-400 transition-all text-left flex items-center gap-2 group whitespace-nowrap"
                  >
                    <span className="font-medium text-gray-800" style={{ fontSize: '11px' }}>{ilce.ilce_adi}</span>
                    <span className="text-xs text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded-full group-hover:bg-amber-300/80">
                      {ilce.mahalle_sayisi}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
