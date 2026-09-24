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
  mahalle_id: number;
}

interface Sokak {
  sokak_adi: string;
  sokak_id: number;
}

export default function IlcePanel({ isOpen, ilAdi, ilceSayisi, mahalleSayisi, onClose, onIlceClick }: IlcePanelProps) {
  const [ilceler, setIlceler] = useState<Ilce[]>([]);
  const [mahalleler, setMahalleler] = useState<Mahalle[]>([]);
  const [sokaklar, setSokaklar] = useState<Sokak[]>([]);
  const [seciliIlce, setSeciliIlce] = useState<string>('');
  const [seciliMahalle, setSeciliMahalle] = useState<string>('');
  const [seciliMahalleId, setSeciliMahalleId] = useState<number>(0);
  const [yukluyor, setYukluyor] = useState(false);
  const [gercekIlceSayisi, setGercekIlceSayisi] = useState<number>(0);
  const [aramaMetni, setAramaMetni] = useState<string>('');

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
        .select('ilce_adi, mahalle_id')
        .eq('il_adi', ilAdiUpper);

      // İlçe bazında unique mahalle ID'leri topla
      const ilceMahalleMap = new Map<string, Set<number>>();
      mahallelerData?.forEach((m: any) => {
        const ilceAdi = m.ilce_adi?.toString().trim();
        const mahalleId = m.mahalle_id;
        if (ilceAdi && mahalleId) {
          if (!ilceMahalleMap.has(ilceAdi)) {
            ilceMahalleMap.set(ilceAdi, new Set());
          }
          ilceMahalleMap.get(ilceAdi)!.add(mahalleId);
        }
      });

      // İlçe listesini oluştur (unique ilçeler ve unique mahalle sayıları ile)
      const ilcelerWithCount = Array.from(ilceMahalleMap.entries())
        .map(([ilce_adi, mahalleIds]) => ({
          ilce_adi,
          mahalle_sayisi: mahalleIds.size,
        }))
        .sort((a, b) => a.ilce_adi.localeCompare(b.ilce_adi));

      setIlceler(ilcelerWithCount);
      setGercekIlceSayisi(ilcelerWithCount.length);
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
        .select('mahalle_adi, mahalle_id')
        .eq('il_adi', ilAdiUpper)
        .eq('ilce_adi', ilceAdi)
        .order('mahalle_adi');

      // Unique mahalleler - mahalle_id'ye göre
      const uniqueMahalleler = mahallelerData ? Array.from(
        new Map(mahallelerData.map((m: any) => [m.mahalle_id, {
          mahalle_adi: m.mahalle_adi,
          mahalle_id: m.mahalle_id
        }])).values()
      ) : [];

      setMahalleler(uniqueMahalleler);
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

  const loadSokaklar = async (mahalleId: number, mahalleAdi: string) => {
    setYukluyor(true);
    try {
      const { data: sokakData } = await supabase
        .from('sokaklar')
        .select('sokak_adi, sokak_id')
        .eq('mahalle_id', mahalleId)
        .order('sokak_adi');

      // Unique sokaklar - sokak_id'ye göre
      const uniqueSokaklar = sokakData ? Array.from(
        new Map(sokakData.map((s: any) => [s.sokak_id, {
          sokak_adi: s.sokak_adi,
          sokak_id: s.sokak_id
        }])).values()
      ) : [];

      setSokaklar(uniqueSokaklar);
      setSeciliMahalle(mahalleAdi);
      setSeciliMahalleId(mahalleId);
    } catch (error) {
      console.error('Sokaklar yüklenirken hata:', error);
    } finally {
      setYukluyor(false);
    }
  };

  const handleBack = () => {
    if (seciliMahalle) {
      // Sokak seviyesinden mahalle seviyesine dön
      setSeciliMahalle('');
      setSokaklar([]);
    } else if (seciliIlce) {
      // Mahalle seviyesinden ilçe seviyesine dön
      setSeciliIlce('');
      setMahalleler([]);

      // Geri dönerken haritayı normal zoom'a getir
      if (onIlceClick) {
        onIlceClick(''); // Boş string = ilçe seçimi iptal
      }
    }
  };

  const handleClose = () => {
    setSeciliIlce('');
    setSeciliMahalle('');
    setMahalleler([]);
    setSokaklar([]);
    setIlceler([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Panel - Petek rengi arka plan */}
      <div
        className="flex flex-col fixed"
        style={{
          zIndex: 1000,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%) scale(1)',
          width: 'min(320px, 80vw)',
          maxHeight: 'min(70vh, 520px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: 1,
          pointerEvents: 'auto',
          transition: 'opacity .15s ease, transform .15s ease',
          background: 'rgba(255,251,242,0.98)',
          border: '3px solid #6b3d10',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3)'
        }}
      >

        {/* Header - Daha kompakt */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          fontSize: '13.5px',
          fontWeight: 600,
          backgroundColor: '#6b3d10',
          color: '#fff8ec'
        }}>
          {(seciliIlce || seciliMahalle) ? (
            <button
              onClick={handleBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontSize: '17px',
                lineHeight: 1,
                padding: '0 2px',
                cursor: 'pointer'
              }}
              aria-label="Geri"
            >
              ←
            </button>
          ) : null}

          <span style={{
            flex: '1 1 auto',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {seciliMahalle
              ? `${seciliMahalle} - ${sokaklar.length} sokak`
              : seciliIlce
              ? `${seciliIlce} - ${mahalleler.length} mahalle`
              : `${ilAdi} - ${gercekIlceSayisi} ilçe`}
          </span>

          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              fontSize: '19px',
              lineHeight: 1,
              padding: '0 2px',
              cursor: 'pointer'
            }}
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        {/* Arama Kutusu - Sadece ilçe veya mahalle listesi gösterilirken */}
        {!seciliMahalle && (seciliIlce || !seciliIlce) && (
          <div style={{ padding: '8px 8px 4px 8px', backgroundColor: 'rgba(255,251,242,0.97)' }}>
            <input
              type="text"
              placeholder={seciliIlce ? "Mahalle ara..." : "İlçe ara..."}
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                border: '1.5px solid #8a5a20',
                borderRadius: '6px',
                backgroundColor: '#fff',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#f2a93b'}
              onBlur={(e) => e.target.style.borderColor = '#8a5a20'}
            />
          </div>
        )}

        {/* Body - Kompakt */}
        <div style={{
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          backgroundColor: 'rgba(255,251,242,0.97)'
        }}>
          {yukluyor ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : seciliMahalle ? (
            // Sokak listesi
            <>
              {sokaklar.length === 0 ? (
                <p style={{ padding: '14px', fontSize: '13px', textAlign: 'center', color: '#6b7280' }}>Sokak bulunamadı</p>
              ) : (
                sokaklar.map((sokak, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background .12s, color .12s',
                      backgroundColor: '#fdf0d5',
                      color: '#4a2a08',
                      border: '1.5px solid #8a5a20',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f2a93b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdf0d5'}
                  >
                    {sokak.sokak_adi}
                  </div>
                ))
              )}
            </>
          ) : seciliIlce ? (
            // Mahalle listesi - Her kutucuk bağımsız buton gibi
            <>
              {mahalleler.filter(m =>
                !aramaMetni || m.mahalle_adi.toLocaleLowerCase('tr-TR').includes(aramaMetni.toLocaleLowerCase('tr-TR'))
              ).length === 0 ? (
                <p style={{ padding: '14px', fontSize: '13px', textAlign: 'center', color: '#6b7280' }}>
                  {aramaMetni ? 'Arama sonucu bulunamadı' : 'Mahalle bulunamadı'}
                </p>
              ) : (
                mahalleler
                  .filter(m =>
                    !aramaMetni || m.mahalle_adi.toLocaleLowerCase('tr-TR').includes(aramaMetni.toLocaleLowerCase('tr-TR'))
                  )
                  .map((mahalle, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSokaklar(mahalle.mahalle_id, mahalle.mahalle_adi)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background .12s, color .12s',
                      backgroundColor: '#fdf0d5',
                      color: '#4a2a08',
                      border: '1.5px solid #8a5a20',
                      borderRadius: '8px',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f2a93b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdf0d5'}
                  >
                    {mahalle.mahalle_adi}
                  </button>
                ))
              )}
            </>
          ) : (
            // İlçe listesi - Her kutucuk bağımsız buton gibi
            <>
              {ilceler.filter(i =>
                !aramaMetni || i.ilce_adi.toLocaleLowerCase('tr-TR').includes(aramaMetni.toLocaleLowerCase('tr-TR'))
              ).length === 0 ? (
                <p style={{ padding: '14px', fontSize: '13px', textAlign: 'center', color: '#6b7280' }}>
                  {aramaMetni ? 'Arama sonucu bulunamadı' : 'İlçe bulunamadı'}
                </p>
              ) : (
                ilceler
                  .filter(i =>
                    !aramaMetni || i.ilce_adi.toLocaleLowerCase('tr-TR').includes(aramaMetni.toLocaleLowerCase('tr-TR'))
                  )
                  .map((ilce, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadMahalleler(ilce.ilce_adi)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background .12s, color .12s',
                      backgroundColor: '#fdf0d5',
                      color: '#4a2a08',
                      border: '1.5px solid #8a5a20',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f2a93b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fdf0d5'}
                  >
                    <span style={{ flex: 1 }}>{ilce.ilce_adi}</span>
                    <span className="text-xs text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded-full group-hover:bg-amber-300/80">
                      {ilce.mahalle_sayisi}
                    </span>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
