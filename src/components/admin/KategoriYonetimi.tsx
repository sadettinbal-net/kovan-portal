'use client';

import { useEffect, useMemo, useState } from 'react';

// Yönetim paneli: firma kategorilerini (firma_kategorileri tablosu) listele, ekle, düzenle, sil.
// Yazma işlemleri /api/admin/kategoriler üzerinden sunucuda, yönetici kontrolüyle yapılır.
type Tip = 'sanayi_sitesi' | 'sanayi_disi' | 'kurumsal';
type Kategori = {
  id: number;
  ad: string;
  tip: Tip;
  ust_kategori_id: number | null;
  sira: number;
  aktif: boolean;
  firma_sayisi: number;
  alt_kategori_sayisi: number;
};
type Form = { id?: number; ad: string; tip: Tip; ust_kategori_id: string; sira: string; aktif: boolean };

const TIPLER: { deger: Tip; ad: string; ikon: string; kutu: string; secili: string; rozet: string }[] = [
  { deger: 'sanayi_sitesi', ad: 'Sanayi Sitesi', ikon: '🏗️', kutu: 'bg-blue-50 border-blue-200', secili: 'ring-2 ring-[#1a3a6b]', rozet: 'bg-blue-100 text-blue-700' },
  { deger: 'sanayi_disi', ad: 'Sanayi Dışı', ikon: '🏪', kutu: 'bg-orange-50 border-orange-200', secili: 'ring-2 ring-[#e8a020]', rozet: 'bg-orange-100 text-orange-700' },
  { deger: 'kurumsal', ad: 'Kurumsal', ikon: '🏢', kutu: 'bg-purple-50 border-purple-200', secili: 'ring-2 ring-purple-500', rozet: 'bg-purple-100 text-purple-700' },
];
const tipBilgisi = (t: Tip) => TIPLER.find((x) => x.deger === t)!;

const buyuk = (s: string) => s.toLocaleUpperCase('tr-TR');
const INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] bg-white';

export default function KategoriYonetimi() {
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [arama, setArama] = useState('');
  const [tipSuzgeci, setTipSuzgeci] = useState<Tip | 'hepsi'>('hepsi');
  const [form, setForm] = useState<Form | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  async function yukle() {
    setYukleniyor(true);
    const res = await fetch('/api/admin/kategoriler');
    if (res.ok) setKategoriler(await res.json());
    else setHata((await res.json()).error || 'Kategoriler yüklenemedi.');
    setYukleniyor(false);
  }

  useEffect(() => {
    yukle();
  }, []);

  const altlari = useMemo(() => {
    const m = new Map<number, Kategori[]>();
    for (const k of kategoriler) if (k.ust_kategori_id) m.set(k.ust_kategori_id, [...(m.get(k.ust_kategori_id) || []), k]);
    return m;
  }, [kategoriler]);

  // Bir ana kategorinin kendi firmaları + alt kategorilerindeki firmalar
  const toplamFirma = (k: Kategori) => k.firma_sayisi + (altlari.get(k.id) || []).reduce((t, a) => t + a.firma_sayisi, 0);

  const sayilar = (t?: Tip) => {
    const liste = t ? kategoriler.filter((k) => k.tip === t) : kategoriler;
    return {
      ana: liste.filter((k) => !k.ust_kategori_id).length,
      alt: liste.filter((k) => k.ust_kategori_id).length,
      firma: liste.reduce((top, k) => top + k.firma_sayisi, 0),
    };
  };

  // Görünen satırlar: ana kategori ve hemen altında alt kategorileri. Aramada, ana veya alt kategorilerinden biri eşleşirse ana görünür.
  const satirlar = useMemo(() => {
    const a = buyuk(arama.trim());
    const eslesir = (k: Kategori) => !a || buyuk(k.ad).includes(a);
    const tipSirasi = (t: Tip) => TIPLER.findIndex((x) => x.deger === t);
    const analar = kategoriler
      .filter((k) => !k.ust_kategori_id && (tipSuzgeci === 'hepsi' || k.tip === tipSuzgeci))
      .sort((x, y) => tipSirasi(x.tip) - tipSirasi(y.tip) || x.sira - y.sira || x.ad.localeCompare(y.ad, 'tr'));
    const sonuc: { k: Kategori; alt: boolean }[] = [];
    for (const ana of analar) {
      const altlar = (altlari.get(ana.id) || []).slice().sort((x, y) => x.sira - y.sira || x.ad.localeCompare(y.ad, 'tr'));
      const anaEslesir = eslesir(ana);
      const eslesenAltlar = anaEslesir ? altlar : altlar.filter(eslesir);
      if (!anaEslesir && eslesenAltlar.length === 0) continue;
      sonuc.push({ k: ana, alt: false });
      for (const alt of eslesenAltlar) sonuc.push({ k: alt, alt: true });
    }
    return sonuc;
  }, [kategoriler, altlari, arama, tipSuzgeci]);

  function yeni(ust?: Kategori) {
    setForm({
      ad: '',
      tip: ust?.tip ?? (tipSuzgeci === 'hepsi' ? 'sanayi_sitesi' : tipSuzgeci),
      ust_kategori_id: ust ? String(ust.id) : '',
      sira: '',
      aktif: true,
    });
    setHata('');
    setMesaj('');
  }

  function duzenle(k: Kategori) {
    setForm({
      id: k.id,
      ad: k.ad,
      tip: k.tip,
      ust_kategori_id: k.ust_kategori_id ? String(k.ust_kategori_id) : '',
      sira: String(k.sira),
      aktif: k.aktif,
    });
    setHata('');
    setMesaj('');
  }

  const duzenlenen = form?.id ? kategoriler.find((k) => k.id === form.id) : undefined;
  // Firması veya alt kategorisi olan kategorinin tipi değiştirilemez (sunucu da kontrol eder)
  const tipKilitli = !!duzenlenen && (duzenlenen.firma_sayisi > 0 || duzenlenen.alt_kategori_sayisi > 0);
  // Ana kategori adayları: aynı tipteki ana kategoriler (kendisi hariç). Alt kategorileri olan bir kategori başka birinin altına giremez.
  const anaAdaylari = form
    ? kategoriler
        .filter((k) => !k.ust_kategori_id && k.tip === form.tip && k.id !== form.id)
        .sort((x, y) => x.sira - y.sira || x.ad.localeCompare(y.ad, 'tr'))
    : [];
  const altinaTasinamaz = !!duzenlenen && duzenlenen.alt_kategori_sayisi > 0;

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setKaydediliyor(true);
    setHata('');
    const res = await fetch('/api/admin/kategoriler', {
      method: form.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: form.id,
        ad: form.ad,
        tip: form.tip,
        ust_kategori_id: form.ust_kategori_id ? parseInt(form.ust_kategori_id) : null,
        sira: form.sira.trim() ? parseInt(form.sira) : undefined,
        aktif: form.aktif,
      }),
    });
    const sonuc = await res.json();
    setKaydediliyor(false);
    if (!res.ok) return setHata(sonuc.error || 'Kaydedilemedi.');
    setMesaj(
      form.id
        ? `"${form.ad.trim()}" güncellendi${sonuc.guncellenen_firma ? `, ${sonuc.guncellenen_firma} firmanın sektör yazısı da güncellendi` : ''}.`
        : `"${form.ad.trim()}" eklendi.`
    );
    setForm(null);
    yukle();
  }

  async function sil(k: Kategori) {
    setHata('');
    setMesaj('');
    if (k.firma_sayisi > 0 || k.alt_kategori_sayisi > 0) {
      const nedenler = [k.firma_sayisi ? `${k.firma_sayisi} firma` : '', k.alt_kategori_sayisi ? `${k.alt_kategori_sayisi} alt kategori` : '']
        .filter(Boolean)
        .join(' ve ');
      return setHata(`"${k.ad}" silinemez: içinde ${nedenler} var. Önce bunları başka bir kategoriye taşıyın.`);
    }
    if (!confirm(`"${k.ad}" silinsin mi? Bu işlem geri alınamaz.`)) return;
    const res = await fetch('/api/admin/kategoriler', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: k.id }),
    });
    const sonuc = await res.json();
    if (!res.ok) return setHata(sonuc.error || 'Silinemedi.');
    setMesaj(`"${k.ad}" silindi.`);
    if (form?.id === k.id) setForm(null);
    yukle();
  }

  const toplam = sayilar();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1a3a6b]">📂 Kategori Yönetimi</h2>

      {/* Kutular: tıklayınca liste o tipe göre süzülür, Toplam'a tıklayınca hepsi */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TIPLER.map((t) => {
          const s = sayilar(t.deger);
          return (
            <button
              key={t.deger}
              onClick={() => setTipSuzgeci(t.deger)}
              className={`text-left rounded-xl border p-4 transition ${t.kutu} ${tipSuzgeci === t.deger ? t.secili : 'hover:shadow'}`}
            >
              <div className="text-2xl font-bold text-[#1a3a6b]">{s.ana + s.alt}</div>
              <div className="text-sm font-semibold text-gray-700">
                {t.ikon} {t.ad}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {s.ana} ana · {s.alt} alt · {s.firma} firma
              </div>
            </button>
          );
        })}
        <button
          onClick={() => setTipSuzgeci('hepsi')}
          className={`text-left rounded-xl border p-4 transition bg-gray-50 border-gray-200 ${tipSuzgeci === 'hepsi' ? 'ring-2 ring-gray-500' : 'hover:shadow'}`}
        >
          <div className="text-2xl font-bold text-gray-700">{toplam.ana + toplam.alt}</div>
          <div className="text-sm font-semibold text-gray-700">Toplam</div>
          <div className="text-xs text-gray-500 mt-1">
            {toplam.ana} ana · {toplam.alt} alt · {toplam.firma} firma
          </div>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Kategori ara..."
          className={`${INPUT} max-w-xs`}
        />
        <span className="text-sm text-gray-500">
          {tipSuzgeci === 'hepsi' ? 'Tüm tipler' : `${tipBilgisi(tipSuzgeci).ikon} ${tipBilgisi(tipSuzgeci).ad}`} gösteriliyor
        </span>
        <button
          onClick={() => yeni()}
          className="ml-auto bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          + Yeni Kategori
        </button>
      </div>

      {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{hata}</div>}
      {mesaj && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{mesaj}</div>}

      {form && (
        <form onSubmit={kaydet} className="bg-white border border-[#dde3ec] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-[#1a3a6b]">{form.id ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori adı *</label>
              <input value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className={INPUT} required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tip *</label>
              <select
                value={form.tip}
                onChange={(e) => setForm({ ...form, tip: e.target.value as Tip, ust_kategori_id: '' })}
                className={INPUT}
                disabled={tipKilitli}
              >
                {TIPLER.map((t) => (
                  <option key={t.deger} value={t.deger}>
                    {t.ikon} {t.ad}
                  </option>
                ))}
              </select>
              {tipKilitli && <p className="text-xs text-gray-500 mt-1">İçinde firma veya alt kategori olduğu için tipi değiştirilemez.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hangi ana kategorinin altında?</label>
              <select
                value={form.ust_kategori_id}
                onChange={(e) => setForm({ ...form, ust_kategori_id: e.target.value })}
                className={INPUT}
                disabled={altinaTasinamaz}
              >
                <option value="">Yok (bu bir ana kategori)</option>
                {anaAdaylari.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                  </option>
                ))}
              </select>
              {altinaTasinamaz && <p className="text-xs text-gray-500 mt-1">Alt kategorileri olduğu için başka bir kategorinin altına taşınamaz.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sıra</label>
              <input
                type="number"
                value={form.sira}
                onChange={(e) => setForm({ ...form, sira: e.target.value })}
                placeholder="Boş bırakılırsa en sona"
                className={INPUT}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 self-end pb-2">
              <input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} />
              Aktif (listelerde görünsün)
            </label>
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
                <th className="px-4 py-2 font-semibold">Kategori</th>
                <th className="px-4 py-2 font-semibold">Tip</th>
                <th className="px-4 py-2 font-semibold text-right">Firma</th>
                <th className="px-4 py-2 font-semibold text-center">Durum</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {satirlar.map(({ k, alt }) => {
                const t = tipBilgisi(k.tip);
                const altToplam = !alt && k.alt_kategori_sayisi > 0 ? toplamFirma(k) : null;
                return (
                  <tr key={k.id} className={alt ? 'hover:bg-gray-50' : 'bg-gray-50/60 hover:bg-gray-100'}>
                    <td className={`py-2 pr-4 ${alt ? 'pl-10' : 'pl-4'}`}>
                      <div className={alt ? 'text-gray-700' : 'font-semibold text-[#1a3a6b]'}>
                        {alt && <span className="text-gray-400 mr-1">└</span>}
                        {k.ad}
                      </div>
                      {!alt && k.alt_kategori_sayisi > 0 && <div className="text-xs text-gray-500">{k.alt_kategori_sayisi} alt kategori</div>}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${t.rozet}`}>
                        {t.ikon} {t.ad}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {k.firma_sayisi}
                      {altToplam !== null && altToplam !== k.firma_sayisi && (
                        <div className="text-xs text-gray-500">altlarla {altToplam}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          k.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {k.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {!alt && (
                        <button onClick={() => yeni(k)} className="text-[#2554a0] hover:underline mr-3">
                          + Alt
                        </button>
                      )}
                      <button onClick={() => duzenle(k)} className="text-[#2554a0] hover:underline mr-3">
                        Düzenle
                      </button>
                      <button onClick={() => sil(k)} className="text-red-600 hover:underline">
                        Sil
                      </button>
                    </td>
                  </tr>
                );
              })}
              {satirlar.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Kategori bulunamadı.
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
