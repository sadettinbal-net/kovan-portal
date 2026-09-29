'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { istanbulYakasi } from '@/lib/istanbul';

// Yönetim paneli: sanayi sitelerini listele, ekle, düzenle, sil; bir siteyi başka bir sitenin içine bağla
type Site = {
  id: number;
  site_adi: string;
  il_adi: string | null;
  ilce_adi: string | null;
  adres: string | null;
  ust_site_id: number | null;
  firma_sayisi: number;
  alt_site_sayisi: number;
};
type Form = { id?: number; site_adi: string; il_adi: string; ilce_adi: string; adres: string; ust_site_id: string };
const BOS_FORM: Form = { site_adi: '', il_adi: '', ilce_adi: '', adres: '', ust_site_id: '' };

const buyuk = (s: string) => s.toLocaleUpperCase('tr-TR');
const INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] bg-white';

export default function SanayiSiteleriYonetimi() {
  const [siteler, setSiteler] = useState<Site[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [arama, setArama] = useState('');
  const [ilSuzgeci, setIlSuzgeci] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [iller, setIller] = useState<{ id: number; sehir_adi: string }[]>([]);
  const [ilceler, setIlceler] = useState<{ id: number; ilce_adi: string }[]>([]);

  async function yukle() {
    setYukleniyor(true);
    const res = await fetch('/api/admin/sanayi-siteleri');
    if (res.ok) setSiteler(await res.json());
    else setHata((await res.json()).error || 'Sanayi siteleri yüklenemedi.');
    setYukleniyor(false);
  }

  useEffect(() => {
    yukle();
    supabase.from('iller').select('id, sehir_adi').order('sehir_adi').then(({ data }) => setIller(data || []));
  }, []);

  // Formdaki ile göre ilçeler
  useEffect(() => {
    const il = iller.find((i) => buyuk(i.sehir_adi) === buyuk(form?.il_adi || ''));
    if (!il) return setIlceler([]);
    supabase
      .from('ilceler')
      .select('id, ilce_adi')
      .eq('sehir_id', il.id)
      .order('ilce_adi')
      .then(({ data }) => setIlceler(data || []));
  }, [form?.il_adi, iller]);

  const adIle = useMemo(() => new Map(siteler.map((s) => [s.id, s.site_adi])), [siteler]);
  const ilListesi = useMemo(
    () => Array.from(new Set(siteler.map((s) => s.il_adi).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'tr')),
    [siteler]
  );
  const gorunenler = siteler.filter((s) => {
    if (ilSuzgeci && s.il_adi !== ilSuzgeci) return false;
    if (!arama) return true;
    const a = buyuk(arama);
    return buyuk(s.site_adi).includes(a) || buyuk(s.ilce_adi || '').includes(a);
  });

  // Üst site olabilecekler: aynı ildeki, kendisi bir sitenin içinde olmayan, kendisi olmayan siteler
  const ustAdaylari = siteler.filter(
    (s) => !s.ust_site_id && s.id !== form?.id && buyuk(s.il_adi || '') === buyuk(form?.il_adi || '')
  );

  function duzenle(s: Site) {
    const ilKaydi = iller.find((i) => buyuk(i.sehir_adi) === s.il_adi);
    setForm({
      id: s.id,
      site_adi: s.site_adi,
      il_adi: ilKaydi?.sehir_adi || s.il_adi || '',
      ilce_adi: s.ilce_adi || '',
      adres: s.adres || '',
      ust_site_id: s.ust_site_id ? String(s.ust_site_id) : '',
    });
    setHata('');
    setMesaj('');
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setKaydediliyor(true);
    setHata('');
    const res = await fetch('/api/admin/sanayi-siteleri', {
      method: form.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ust_site_id: form.ust_site_id ? parseInt(form.ust_site_id) : null }),
    });
    const sonuc = await res.json();
    setKaydediliyor(false);
    if (!res.ok) return setHata(sonuc.error || 'Kaydedilemedi.');
    setMesaj(
      form.id
        ? `"${form.site_adi}" güncellendi${sonuc.guncellenen_firma ? `, ${sonuc.guncellenen_firma} firması da güncellendi` : ''}.`
        : `"${form.site_adi}" eklendi.`
    );
    setForm(null);
    yukle();
  }

  async function sil(s: Site) {
    if (!confirm(`"${s.site_adi}" silinsin mi? Bu işlem geri alınamaz.`)) return;
    setHata('');
    const res = await fetch('/api/admin/sanayi-siteleri', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id }),
    });
    const sonuc = await res.json();
    if (!res.ok) return setHata(sonuc.error || 'Silinemedi.');
    setMesaj(`"${s.site_adi}" silindi.`);
    yukle();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Site veya ilçe ara..."
          className={`${INPUT} max-w-xs`}
        />
        <select value={ilSuzgeci} onChange={(e) => setIlSuzgeci(e.target.value)} className={`${INPUT} max-w-[12rem]`}>
          <option value="">Tüm iller ({siteler.length})</option>
          {ilListesi.map((il) => (
            <option key={il} value={il}>
              {il} ({siteler.filter((s) => s.il_adi === il).length})
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setForm({ ...BOS_FORM });
            setHata('');
            setMesaj('');
          }}
          className="ml-auto bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          + Yeni Sanayi Sitesi
        </button>
      </div>

      {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{hata}</div>}
      {mesaj && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{mesaj}</div>}

      {form && (
        <form onSubmit={kaydet} className="bg-white border border-[#dde3ec] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-[#1a3a6b]">{form.id ? 'Sanayi Sitesini Düzenle' : 'Yeni Sanayi Sitesi'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Site adı *</label>
              <input value={form.site_adi} onChange={(e) => setForm({ ...form, site_adi: e.target.value })} className={INPUT} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İl *</label>
              <select
                value={form.il_adi}
                onChange={(e) => setForm({ ...form, il_adi: e.target.value, ilce_adi: '', ust_site_id: '' })}
                className={INPUT}
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-1">İlçe *</label>
              <select
                value={buyuk(form.ilce_adi)}
                onChange={(e) => setForm({ ...form, ilce_adi: e.target.value })}
                className={INPUT}
                required
                disabled={!form.il_adi}
              >
                <option value="">{form.il_adi ? 'Seçin...' : 'Önce il seçin'}</option>
                {ilceler.map((i) => (
                  <option key={i.id} value={buyuk(i.ilce_adi)}>
                    {i.ilce_adi}
                  </option>
                ))}
              </select>
              {istanbulYakasi(form.ilce_adi) && <p className="text-xs text-gray-500 mt-1">{istanbulYakasi(form.ilce_adi)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hangi sanayi sitesinin içinde?</label>
              <select value={form.ust_site_id} onChange={(e) => setForm({ ...form, ust_site_id: e.target.value })} className={INPUT}>
                <option value="">Bağımsız (başka bir sitenin içinde değil)</option>
                {ustAdaylari.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_adi}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
              <input value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} className={INPUT} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={kaydediliyor}
              className="bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
            >
              {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => setForm(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-5 py-2 rounded-lg">
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {yukleniyor ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl border border-[#dde3ec] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f4f6f9] text-gray-600 text-left">
              <tr>
                <th className="px-4 py-2 font-semibold">Sanayi sitesi</th>
                <th className="px-4 py-2 font-semibold">İl / İlçe</th>
                <th className="px-4 py-2 font-semibold">İçinde olduğu site</th>
                <th className="px-4 py-2 font-semibold text-right">Firma</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gorunenler.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="font-medium text-[#1a3a6b]">{s.site_adi}</div>
                    {s.alt_site_sayisi > 0 && <div className="text-xs text-gray-500">İçinde {s.alt_site_sayisi} site var</div>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {s.il_adi} / {s.ilce_adi}
                    {istanbulYakasi(s.ilce_adi) && <div className="text-xs text-gray-400">{istanbulYakasi(s.ilce_adi)}</div>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{s.ust_site_id ? adIle.get(s.ust_site_id) : '—'}</td>
                  <td className="px-4 py-2 text-right">{s.firma_sayisi}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => duzenle(s)} className="text-[#2554a0] hover:underline mr-3">
                      Düzenle
                    </button>
                    <button onClick={() => sil(s)} className="text-red-600 hover:underline">
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {gorunenler.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
