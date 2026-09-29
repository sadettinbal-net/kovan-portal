'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// İl → İlçe → Mahalle → Sokak seçimi (Kovan'ın Türkiye geneli konum tabloları).
// il/ilce adla, mahalle/sokak numarayla tutulur: mahalleId = mahalleler_yeni.mahalle_id, sokakId = sokaklar.sokak_id
export type Konum = { il: string; ilce: string; mahalleId: string; sokakId: string };
export const BOS_KONUM: Konum = { il: '', ilce: '', mahalleId: '', sokakId: '' };

type Il = { id: number; sehir_adi: string };
type Ilce = { id: number; ilce_adi: string };
type Mahalle = { mahalle_id: number; mahalle_adi: string };
type Sokak = { sokak_id: number; sokak_adi: string };

const SELECT =
  'w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-400';

export default function KonumSecici({
  deger,
  onChange,
  zorunluIlIlce = false,
}: {
  deger: Konum;
  onChange: (konum: Konum) => void;
  zorunluIlIlce?: boolean;
}) {
  const [iller, setIller] = useState<Il[]>([]);
  const [ilceler, setIlceler] = useState<Ilce[]>([]);
  const [mahalleler, setMahalleler] = useState<Mahalle[]>([]);
  const [sokaklar, setSokaklar] = useState<Sokak[]>([]);
  const [sokakArama, setSokakArama] = useState('');

  useEffect(() => {
    supabase.from('iller').select('id, sehir_adi').order('sehir_adi').then(({ data }) => setIller(data || []));
  }, []);

  const ilKaydi = iller.find((i) => i.sehir_adi === deger.il);
  const ilceKaydi = ilceler.find((i) => i.ilce_adi === deger.ilce);

  useEffect(() => {
    if (!ilKaydi) return setIlceler([]);
    supabase
      .from('ilceler')
      .select('id, ilce_adi')
      .eq('sehir_id', ilKaydi.id)
      .order('ilce_adi')
      .then(({ data }) => setIlceler(data || []));
  }, [ilKaydi?.id]);

  useEffect(() => {
    if (!ilceKaydi) return setMahalleler([]);
    supabase
      .from('mahalleler_yeni')
      .select('mahalle_id, mahalle_adi')
      .eq('ilce_id', ilceKaydi.id)
      .order('mahalle_adi')
      .then(({ data }) => {
        // Aynı mahalle birden fazla kayıtla gelebiliyor
        setMahalleler(Array.from(new Map((data || []).map((m) => [m.mahalle_id, m])).values()));
      });
  }, [ilceKaydi?.id]);

  useEffect(() => {
    if (!deger.mahalleId) return setSokaklar([]);
    let sorgu = supabase.from('sokaklar').select('sokak_id, sokak_adi').eq('mahalle_id', parseInt(deger.mahalleId));
    if (sokakArama) sorgu = sorgu.ilike('sokak_adi', `%${sokakArama}%`);
    sorgu
      .order('sokak_adi')
      .limit(1000)
      .then(({ data }) => {
        setSokaklar(Array.from(new Map((data || []).map((s) => [s.sokak_id, s])).values()));
      });
  }, [deger.mahalleId, sokakArama]);

  const yildiz = zorunluIlIlce ? <span className="text-red-500"> *</span> : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">İl{yildiz}</label>
        <select
          value={deger.il}
          onChange={(e) => {
            setSokakArama('');
            onChange({ ...BOS_KONUM, il: e.target.value });
          }}
          className={SELECT}
        >
          <option value="">Seçin...</option>
          {iller.map((i) => (
            <option key={i.id} value={i.sehir_adi}>
              {i.sehir_adi}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">İlçe{yildiz}</label>
        <select
          value={deger.ilce}
          disabled={!deger.il}
          onChange={(e) => {
            setSokakArama('');
            onChange({ ...BOS_KONUM, il: deger.il, ilce: e.target.value });
          }}
          className={SELECT}
        >
          <option value="">{deger.il ? 'Seçin...' : 'Önce il seçin'}</option>
          {ilceler.map((i) => (
            <option key={i.id} value={i.ilce_adi}>
              {i.ilce_adi}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle</label>
        <select
          value={deger.mahalleId}
          disabled={!deger.ilce}
          onChange={(e) => {
            setSokakArama('');
            onChange({ ...deger, mahalleId: e.target.value, sokakId: '' });
          }}
          className={SELECT}
        >
          <option value="">{deger.ilce ? 'Tüm mahalleler' : 'Önce ilçe seçin'}</option>
          {mahalleler.map((m) => (
            <option key={m.mahalle_id} value={m.mahalle_id}>
              {m.mahalle_adi}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sokak</label>
        {deger.mahalleId && (
          <input
            type="search"
            value={sokakArama}
            onChange={(e) => setSokakArama(e.target.value)}
            placeholder="Sokak ara..."
            className={`${SELECT} mb-2`}
          />
        )}
        <select
          value={deger.sokakId}
          disabled={!deger.mahalleId}
          onChange={(e) => onChange({ ...deger, sokakId: e.target.value })}
          className={SELECT}
        >
          <option value="">{deger.mahalleId ? `Tüm sokaklar (${sokaklar.length})` : 'Önce mahalle seçin'}</option>
          {sokaklar.map((s) => (
            <option key={s.sokak_id} value={s.sokak_id}>
              {s.sokak_adi}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
