'use client';

import { useCallback, useEffect, useState } from 'react';

// Yönetim Paneli → Ziyaretçiler: her ziyaret (tarayıcı sekmesi) bir satır.
// IP, konum (ülke / bölge / şehir), cihaz, sitede kalma süresi, gezilen sayfa ve tıklama sayısı; satıra tıklayınca adım adım geçmiş.
// Tek tek, seçerek ya da tümünü silme.

type Oturum = {
  id: string;
  ip: string | null;
  ulke: string | null;
  bolge: string | null;
  sehir: string | null;
  cihaz: string | null;
  isletim_sistemi: string | null;
  tarayici: string | null;
  ekran: string | null;
  dil: string | null;
  referrer: string | null;
  giris_sayfasi: string | null;
  baslangic: string;
  son_gorulme: string;
  sayfa_sayisi: number;
  tiklama_sayisi: number;
  reklam_tiklama_sayisi?: number;
};

type Olay = { id: number; tip: 'sayfa' | 'tiklama' | 'reklam_tik' | 'reklam_izle'; sayfa: string | null; hedef: string | null; baglanti: string | null; reklam_id: number | null; sure_ms: number | null; created_at: string };
type ReklamBilgisi = { baslik: string; konum: string; panel: number | null };

// Reklam Yönetimi'ndeki alan adları
const REKLAM_ALANI: Record<string, string> = {
  video: 'Sayfa içi reklam',
  popup: 'Açılır reklam (Geç →)',
  sidebar: 'Sol menü reklam kutusu',
  anasayfa_ust: 'Ana sayfa üst şerit',
  anasayfa_sol: 'Ana sayfa sol panel',
  anasayfa_sag: 'Ana sayfa sağ panel',
  detay_sol: 'Detay sayfası sol panel',
  detay_sag: 'Detay sayfası sağ panel',
  site_sol: 'Sanayi sitesi sol panel',
  site_sag: 'Sanayi sitesi sağ panel',
  tip_sol: 'Sanayi dışı / Kurumsal sol panel',
  tip_sag: 'Sanayi dışı / Kurumsal sağ panel',
};
const PANEL_ADI = ['', 'üst', 'orta', 'alt'];
const reklamYazisi = (id: number | null, rk: Record<number, ReklamBilgisi>) => {
  const r = id ? rk[id] : undefined;
  if (!r) return `#${id ?? '?'} (silinmiş reklam)`;
  const alan = REKLAM_ALANI[r.konum] || r.konum;
  return `${r.baslik || 'Başlıksız reklam'} — ${alan}${r.panel ? ` (${PANEL_ADI[r.panel] || r.panel})` : ''}`;
};
const saniye = (ms: number | null) => {
  const sn = Math.round((ms || 0) / 1000);
  return sn >= 60 ? `${Math.floor(sn / 60)} dk ${sn % 60} sn` : `${sn} sn`;
};

const TR = 'tr-TR';
const tarihSaat = (iso: string) =>
  new Date(iso).toLocaleString(TR, { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const saat = (iso: string) =>
  new Date(iso).toLocaleTimeString(TR, { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit' });

function sure(bas: string, son: string) {
  const sn = Math.max(0, Math.round((new Date(son).getTime() - new Date(bas).getTime()) / 1000));
  if (sn < 15) return '15 sn’den az';
  const dk = Math.floor(sn / 60);
  const kalan = sn % 60;
  if (dk >= 60) return `${Math.floor(dk / 60)} sa ${dk % 60} dk`;
  return dk ? `${dk} dk ${kalan} sn` : `${kalan} sn`;
}

function nereden(ref: string | null) {
  if (!ref) return 'Doğrudan';
  try {
    const h = new URL(ref).hostname.replace(/^www\./, '');
    if (/google\./.test(h)) return 'Google';
    if (/bing\./.test(h)) return 'Bing';
    if (/yandex\./.test(h)) return 'Yandex';
    if (/facebook\.|fb\./.test(h)) return 'Facebook';
    if (/instagram\./.test(h)) return 'Instagram';
    if (/t\.co$|twitter\.|x\.com/.test(h)) return 'X (Twitter)';
    return h;
  } catch {
    return ref.slice(0, 40);
  }
}

// Adres bir firma sayfasıysa (/firma/123) firmanın adı
function FirmaAdi({ yol, adlar }: { yol: string | null; adlar: Record<number, string> }) {
  const m = yol?.match(/\/firma\/(\d+)/);
  if (!m) return null;
  const ad = adlar[Number(m[1])];
  return <span className="ml-1 text-[#1a3a6b] font-semibold">({ad || 'silinmiş firma'})</span>;
}

const konumYazisi = (o: Oturum) => [o.sehir, o.bolge && o.bolge !== o.sehir ? o.bolge : null, o.ulke].filter(Boolean).join(', ') || 'Bilinmiyor';
const cihazSimge = (c: string | null) => (c === 'Mobil' ? '📱' : c === 'Tablet' ? '📲' : c === 'Laptop' ? '💻' : c ? '🖥️' : '❔');
// Hâlâ sitede mi? (son sinyal 1 dakikadan yeni)
const cevrimici = (o: Oturum) => Date.now() - new Date(o.son_gorulme).getTime() < 60000;

export default function AdminZiyaretciler() {
  const [oturumlar, setOturumlar] = useState<Oturum[]>([]);
  const [toplam, setToplam] = useState(0);
  const [sayfaBoyu, setSayfaBoyu] = useState(50);
  const [sayfa, setSayfa] = useState(1);
  const [ara, setAra] = useState('');
  const [aranan, setAranan] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [acik, setAcik] = useState<Oturum | null>(null);
  const [olaylar, setOlaylar] = useState<Olay[] | null>(null);
  const [firmaAdlari, setFirmaAdlari] = useState<Record<number, string>>({});
  const [reklamlar, setReklamlar] = useState<Record<number, ReklamBilgisi>>({});
  const [siliniyor, setSiliniyor] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata(null);
    try {
      const qs = new URLSearchParams({ sayfa: String(sayfa) });
      if (aranan) qs.set('ara', aranan);
      const r = await fetch(`/api/admin/ziyaretciler?${qs}`, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Yüklenemedi');
      setOturumlar(d.oturumlar);
      setToplam(d.toplam);
      setSayfaBoyu(d.sayfaBoyu);
      setSecili(new Set());
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Yüklenemedi');
    } finally {
      setYukleniyor(false);
    }
  }, [sayfa, aranan]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  async function detayAc(o: Oturum) {
    setAcik(o);
    setOlaylar(null);
    const r = await fetch(`/api/admin/ziyaretciler?id=${o.id}`, { cache: 'no-store' });
    const d = await r.json().catch(() => ({}));
    setFirmaAdlari(d.firmaAdlari || {});
    setReklamlar(d.reklamlar || {});
    setOlaylar(d.olaylar || []);
  }

  async function sil(govde: { idler?: string[]; tumu?: boolean }, soru: string) {
    if (!window.confirm(soru)) return;
    setSiliniyor(true);
    try {
      const r = await fetch('/api/admin/ziyaretciler', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Silinemedi');
      if (acik && (govde.tumu || govde.idler?.includes(acik.id))) setAcik(null);
      if (govde.tumu) setSayfa(1);
      await yukle();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Silinemedi');
    } finally {
      setSiliniyor(false);
    }
  }

  const hepsiSecili = oturumlar.length > 0 && oturumlar.every((o) => secili.has(o.id));
  const toplamSayfa = Math.max(1, Math.ceil(toplam / sayfaBoyu));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-[#1a3a6b] mr-auto">👣 Ziyaretçiler <span className="text-sm font-normal text-gray-500">({toplam} ziyaret)</span></h2>
        <form
          onSubmit={(e) => { e.preventDefault(); setSayfa(1); setAranan(ara.trim()); }}
          className="flex gap-1"
        >
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="IP, şehir, ülke, cihaz ara" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-56" />
          <button className="bg-[#1a3a6b] text-white text-sm px-3 py-1.5 rounded-lg">Ara</button>
        </form>
        <button onClick={yukle} className="border border-gray-300 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50">↻ Yenile</button>
        <button
          disabled={!secili.size || siliniyor}
          onClick={() => sil({ idler: [...secili] }, `Seçilen ${secili.size} ziyaret ve tüm sayfa/tıklama kayıtları silinsin mi?`)}
          className="bg-red-50 text-red-700 border border-red-200 text-sm px-3 py-1.5 rounded-lg disabled:opacity-40"
        >
          🗑️ Seçilenleri sil ({secili.size})
        </button>
        <button
          disabled={!toplam || siliniyor}
          onClick={() => sil({ tumu: true }, `TÜM ziyaretçi kayıtları (${toplam} ziyaret) kalıcı olarak silinsin mi? Bu geri alınamaz.`)}
          className="bg-red-600 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-40"
        >
          Tümünü sil
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Konum IP adresinden çıkarılır ve en fazla şehir/bölge düzeyindedir (mahalle IP&apos;den bilinemez). Site kendi bilgisayarınızda (localhost) açıkken konum boş görünür; yayına alınınca dolar.
      </p>

      {hata && <p className="text-sm text-red-600 mb-3">{hata}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2 pr-2">
                <input type="checkbox" checked={hepsiSecili} onChange={(e) => setSecili(e.target.checked ? new Set(oturumlar.map((o) => o.id)) : new Set())} />
              </th>
              <th className="py-2 pr-3">Giriş zamanı</th>
              <th className="py-2 pr-3">IP adresi</th>
              <th className="py-2 pr-3">Konum</th>
              <th className="py-2 pr-3">Cihaz</th>
              <th className="py-2 pr-3">Süre</th>
              <th className="py-2 pr-3 text-center">Sayfa</th>
              <th className="py-2 pr-3 text-center">Tıklama</th>
              <th className="py-2 pr-3 text-center">Reklam tık.</th>
              <th className="py-2 pr-3">Nereden geldi</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {yukleniyor && !oturumlar.length ? (
              <tr><td colSpan={11} className="py-8 text-center text-gray-400">Yükleniyor…</td></tr>
            ) : !oturumlar.length ? (
              <tr><td colSpan={11} className="py-8 text-center text-gray-400">Henüz ziyaretçi kaydı yok.</td></tr>
            ) : (
              oturumlar.map((o) => (
                <tr key={o.id} className={`border-b border-gray-100 hover:bg-blue-50/40 cursor-pointer ${acik?.id === o.id ? 'bg-blue-50' : ''}`} onClick={() => detayAc(o)}>
                  <td className="py-2 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={secili.has(o.id)}
                      onChange={(e) => {
                        const s = new Set(secili);
                        if (e.target.checked) s.add(o.id); else s.delete(o.id);
                        setSecili(s);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {cevrimici(o) && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" title="Şu an sitede" />}
                    {tarihSaat(o.baslangic)}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{o.ip || '—'}</td>
                  <td className="py-2 pr-3">{konumYazisi(o)}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {cihazSimge(o.cihaz)} {o.cihaz || '—'}
                    <div className="text-[11px] text-gray-500">{[o.isletim_sistemi, o.tarayici].filter(Boolean).join(' · ')}</div>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">{sure(o.baslangic, o.son_gorulme)}</td>
                  <td className="py-2 pr-3 text-center">{o.sayfa_sayisi}</td>
                  <td className="py-2 pr-3 text-center">{o.tiklama_sayisi}</td>
                  <td className="py-2 pr-3 text-center">{o.reklam_tiklama_sayisi ? <span className="font-bold text-[#e8a020]">{o.reklam_tiklama_sayisi}</span> : 0}</td>
                  <td className="py-2 pr-3 text-xs">{nereden(o.referrer)}</td>
                  <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={siliniyor}
                      onClick={() => sil({ idler: [o.id] }, `${o.ip || 'Bu'} ziyaretinin tüm kayıtları silinsin mi?`)}
                      className="text-red-600 hover:bg-red-50 rounded px-2 py-1 text-xs"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toplamSayfa > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 text-sm">
          <button disabled={sayfa <= 1} onClick={() => setSayfa(sayfa - 1)} className="px-3 py-1 border rounded disabled:opacity-40">‹ Önceki</button>
          <span className="text-gray-600">{sayfa} / {toplamSayfa}</span>
          <button disabled={sayfa >= toplamSayfa} onClick={() => setSayfa(sayfa + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Sonraki ›</button>
        </div>
      )}

      {/* Ziyaret detayı: adım adım sayfa ve tıklama geçmişi */}
      {acik && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setAcik(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-2">
              <span className="font-bold text-[#1a3a6b] mr-auto">Ziyaret Detayı</span>
              <button
                disabled={siliniyor}
                onClick={() => sil({ idler: [acik.id] }, 'Bu ziyaretin tüm kayıtları silinsin mi?')}
                className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-lg"
              >
                🗑️ Sil
              </button>
              <button onClick={() => setAcik(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-1">×</button>
            </div>
            <div className="p-4 space-y-1.5 text-sm border-b">
              {[
                ['IP adresi', acik.ip || 'Bilinmiyor'],
                ['Konum', konumYazisi(acik)],
                ['Cihaz', [acik.cihaz, acik.isletim_sistemi, acik.tarayici].filter(Boolean).join(' · ') || 'Bilinmiyor'],
                ['Ekran', acik.ekran || '—'],
                ['Dil', acik.dil || '—'],
                ['Giriş', tarihSaat(acik.baslangic)],
                ['Son hareket', tarihSaat(acik.son_gorulme)],
                ['Sitede kalma', sure(acik.baslangic, acik.son_gorulme)],
                ['Nereden geldi', acik.referrer || 'Doğrudan (adres yazarak / yer imi)'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="w-28 shrink-0 text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800 break-all">{v}</span>
                </div>
              ))}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Sitede yaptıkları</h3>
              {olaylar === null ? (
                <p className="text-gray-400 text-sm">Yükleniyor…</p>
              ) : !olaylar.length ? (
                <p className="text-gray-400 text-sm">Kayıt yok.</p>
              ) : (
                <ol className="space-y-1.5">
                  {olaylar.map((e) => (
                    <li key={e.id} className="flex gap-2 text-sm">
                      <span className="text-xs text-gray-400 font-mono pt-0.5 w-16 shrink-0">{saat(e.created_at)}</span>
                      {e.tip === 'sayfa' ? (
                        <span>📄 <span className="text-gray-500">Sayfayı açtı:</span> <span className="font-medium break-all">{e.sayfa}</span><FirmaAdi yol={e.sayfa} adlar={firmaAdlari} /></span>
                      ) : e.tip === 'reklam_tik' ? (
                        <span className="bg-orange-50 border border-orange-200 rounded px-2 py-1 -mx-1 block">
                          📢 <span className="text-orange-700 font-semibold">Reklama tıkladı:</span> <span className="font-medium">{reklamYazisi(e.reklam_id, reklamlar)}</span>
                          {e.baglanti && <span className="block text-xs text-gray-500 break-all">→ {e.baglanti}</span>}
                        </span>
                      ) : e.tip === 'reklam_izle' ? (
                        <span>
                          👁️ <span className="text-gray-500">Reklamı gördü:</span> <span className="font-medium">{reklamYazisi(e.reklam_id, reklamlar)}</span>
                          <span className="ml-1 font-bold text-[#1a3a6b]">— {saniye(e.sure_ms)}</span>
                        </span>
                      ) : (
                        <span>
                          👆 <span className="text-gray-500">Tıkladı:</span> <span className="font-medium">{e.hedef || '—'}</span>
                          {e.baglanti && <span className="block text-xs text-gray-400 break-all">→ {e.baglanti}<FirmaAdi yol={e.baglanti} adlar={firmaAdlari} /></span>}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
