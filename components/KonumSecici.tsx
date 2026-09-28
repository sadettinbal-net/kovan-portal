'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Admin dükkan formunda konum seçimi: il → ilçe → mahalle (zorunlu) → sokak (isteğe bağlı)
// mahalleId = mahalleler_yeni.mahalle_id, sokakId = sokaklar.sokak_id
export default function KonumSecici({
  mahalleId,
  sokakId,
  onChange,
}: {
  mahalleId: string;
  sokakId: string;
  onChange: (konum: { mahalleId: string; sokakId: string }) => void;
}) {
  const [iller, setIller] = useState<any[]>([]);
  const [ilceler, setIlceler] = useState<any[]>([]);
  const [mahalleler, setMahalleler] = useState<any[]>([]);
  const [sokaklar, setSokaklar] = useState<any[]>([]);

  const [ilId, setIlId] = useState('');
  const [ilceId, setIlceId] = useState('');
  const [sokakArama, setSokakArama] = useState('');
  const [baslangicYuklendi, setBaslangicYuklendi] = useState(false);

  useEffect(() => {
    supabase
      .from('iller')
      .select('id, sehir_adi')
      .order('sehir_adi')
      .then(({ data }) => setIller(data || []));
  }, []);

  // Düzenleme sayfasında mevcut konumun il/ilçesini doldur
  useEffect(() => {
    if (baslangicYuklendi) return;
    if (!mahalleId && !sokakId) {
      setBaslangicYuklendi(true);
      return;
    }
    // sokaklar.ilce_id / il_id ilceler tablosuyla eşleşmiyor; il ve ilçeyi mahalleler_yeni üzerinden buluyoruz
    (async () => {
      let mahalle_id = mahalleId ? parseInt(mahalleId) : null;

      if (!mahalle_id && sokakId) {
        const { data: sokakData } = await supabase
          .from('sokaklar')
          .select('mahalle_id')
          .eq('sokak_id', parseInt(sokakId))
          .limit(1);
        mahalle_id = sokakData?.[0]?.mahalle_id || null;
      }

      if (mahalle_id) {
        const { data: mahalleData } = await supabase
          .from('mahalleler_yeni')
          .select('sehir_id, ilce_id')
          .eq('mahalle_id', mahalle_id)
          .limit(1);
        const mahalle = mahalleData?.[0];
        if (mahalle) {
          setIlId(mahalle.sehir_id?.toString() || '');
          setIlceId(mahalle.ilce_id?.toString() || '');
          if (!mahalleId) onChange({ mahalleId: mahalle_id.toString(), sokakId });
        }
      }
      setBaslangicYuklendi(true);
    })();
  }, [mahalleId, sokakId, baslangicYuklendi]);

  useEffect(() => {
    if (!ilId) {
      setIlceler([]);
      return;
    }
    supabase
      .from('ilceler')
      .select('id, ilce_adi')
      .eq('sehir_id', parseInt(ilId))
      .order('ilce_adi')
      .then(({ data }) => setIlceler(data || []));
  }, [ilId]);

  useEffect(() => {
    if (!ilceId) {
      setMahalleler([]);
      return;
    }
    supabase
      .from('mahalleler_yeni')
      .select('mahalle_id, mahalle_adi')
      .eq('ilce_id', parseInt(ilceId))
      .order('mahalle_adi')
      .then(({ data }) => {
        // Aynı mahalle birden fazla kayıtla gelebiliyor
        const tekil = Array.from(new Map((data || []).map((m: any) => [m.mahalle_id, m])).values());
        setMahalleler(tekil);
      });
  }, [ilceId]);

  useEffect(() => {
    if (!mahalleId) {
      setSokaklar([]);
      return;
    }
    let query = supabase
      .from('sokaklar')
      .select('sokak_id, sokak_adi')
      .eq('mahalle_id', parseInt(mahalleId));
    if (sokakArama) {
      query = query.ilike('sokak_adi', `%${sokakArama}%`);
    }
    query
      .order('sokak_adi')
      .limit(1000)
      .then(({ data }) => {
        // Aynı sokak birden fazla kayıtla gelebiliyor
        const tekil = Array.from(new Map((data || []).map((s: any) => [s.sokak_id, s])).values());
        setSokaklar(tekil);
      });
  }, [mahalleId, sokakArama]);

  const selectClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';

  return (
    <div className="space-y-3">
      <select
        value={ilId}
        onChange={(e) => {
          setIlId(e.target.value);
          setIlceId('');
          setSokakArama('');
          onChange({ mahalleId: '', sokakId: '' });
        }}
        className={selectClass}
      >
        <option value="">İl seçiniz</option>
        {iller.map((il) => (
          <option key={il.id} value={il.id}>
            {il.sehir_adi}
          </option>
        ))}
      </select>

      {ilId && (
        <select
          value={ilceId}
          onChange={(e) => {
            setIlceId(e.target.value);
            setSokakArama('');
            onChange({ mahalleId: '', sokakId: '' });
          }}
          className={selectClass}
        >
          <option value="">İlçe seçiniz</option>
          {ilceler.map((ilce) => (
            <option key={ilce.id} value={ilce.id}>
              {ilce.ilce_adi}
            </option>
          ))}
        </select>
      )}

      {ilceId && (
        <select
          value={mahalleId}
          onChange={(e) => {
            setSokakArama('');
            onChange({ mahalleId: e.target.value, sokakId: '' });
          }}
          className={selectClass}
        >
          <option value="">Mahalle seçiniz</option>
          {mahalleler.map((mahalle) => (
            <option key={mahalle.mahalle_id} value={mahalle.mahalle_id}>
              {mahalle.mahalle_adi}
            </option>
          ))}
        </select>
      )}

      {mahalleId && (
        <>
          <input
            type="text"
            value={sokakArama}
            onChange={(e) => setSokakArama(e.target.value)}
            placeholder="Sokak ara... (isteğe bağlı)"
            className={selectClass}
          />
          <select
            value={sokakId}
            onChange={(e) => onChange({ mahalleId, sokakId: e.target.value })}
            className={selectClass}
          >
            <option value="">Sokak seçiniz (isteğe bağlı, {sokaklar.length} sokak)</option>
            {sokaklar.map((sokak) => (
              <option key={sokak.sokak_id} value={sokak.sokak_id}>
                {sokak.sokak_adi}
              </option>
            ))}
          </select>
        </>
      )}

      {(ilId || mahalleId || sokakId) && (
        <button
          type="button"
          onClick={() => {
            setIlId('');
            setIlceId('');
            setSokakArama('');
            onChange({ mahalleId: '', sokakId: '' });
          }}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Konum seçimini temizle
        </button>
      )}
    </div>
  );
}
