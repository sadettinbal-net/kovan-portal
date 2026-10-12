'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

// Yönetici paneli "📞 Telefon Talepleri" sekmesi: işletme sahiplerinin doğruladığı numaralar.
// Onaylanınca numara firmaya yazılır (cep → mobil telefon, sabit → telefon); firma e-postası ve sahibi boşsa doldurulur.

type FirmaOzet = { id: number; ad: string; sektor: string | null; adres: string | null; telefon: string | null; mobil_telefon: string | null; eposta: string | null; kullanici_email: string | null };
type Talep = {
  id: number;
  firma_id: number;
  kullanici_email: string;
  ad_soyad: string | null;
  telefon: string;
  tur: 'cep' | 'sabit';
  durum: 'dogrulama_bekliyor' | 'onay_bekliyor' | 'onaylandi' | 'reddedildi' | 'iptal';
  dogrulandi_at: string | null;
  kvkk_onay_at: string;
  kvkk_surum: string;
  karar_at: string | null;
  karar_veren: string | null;
  red_nedeni: string | null;
  created_at: string;
  firmalar: FirmaOzet | null;
};
type Suzgec = 'onay_bekliyor' | 'dogrulama_bekliyor' | 'onaylandi' | 'reddedildi' | 'tumu';

const SUZGECLER: [Suzgec, string][] = [
  ['onay_bekliyor', '⏳ Onay bekleyen'],
  ['dogrulama_bekliyor', '🔑 Kod / e-posta bekleyen'],
  ['onaylandi', '✅ Onaylanan'],
  ['reddedildi', '❌ Reddedilen'],
  ['tumu', 'Tümü'],
];

const DURUM_ETIKET: Record<Talep['durum'], string> = {
  dogrulama_bekliyor: 'Doğrulama bekliyor',
  onay_bekliyor: 'Onay bekliyor',
  onaylandi: 'Onaylandı',
  reddedildi: 'Reddedildi',
  iptal: 'İptal',
};

const goster = (t: string) => (t.length === 11 ? `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7, 9)} ${t.slice(9)}` : t);
const tarih = (s: string | null) => (s ? new Date(s).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export default function AdminTelefonTalepleri({ onSayi }: { onSayi: (n: number) => void }) {
  const [suzgec, setSuzgec] = useState<Suzgec>('onay_bekliyor');
  const [talepler, setTalepler] = useState<Talep[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [redId, setRedId] = useState<number | null>(null);
  const [redNeden, setRedNeden] = useState('');
  const [mesgulId, setMesgulId] = useState<number | null>(null);

  const yukle = useCallback(async (s: Suzgec) => {
    const res = await fetch(`/api/admin/telefon-talepleri?durum=${s}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setTalepler(data.talepler);
      if (s === 'onay_bekliyor') onSayi(data.talepler.length);
    } else setHata(data.error || 'Talepler yüklenemedi.');
    setYukleniyor(false);
  }, [onSayi]);

  useEffect(() => { yukle(suzgec); }, [yukle, suzgec]);

  async function karar(id: number, islem: 'onayla' | 'reddet') {
    setHata('');
    setMesgulId(id);
    const res = await fetch('/api/admin/telefon-talepleri', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, islem, red_nedeni: islem === 'reddet' ? redNeden : undefined }),
    });
    if (!res.ok) setHata((await res.json().catch(() => ({}))).error || 'İşlem başarısız.');
    setMesgulId(null);
    setRedId(null);
    setRedNeden('');
    if (suzgec !== 'onay_bekliyor') {
      const s = await fetch('/api/admin/telefon-talepleri?durum=onay_bekliyor').then((r) => r.json()).catch(() => null);
      if (s?.talepler) onSayi(s.talepler.length);
    }
    yukle(suzgec);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-[#1a3a6b]">📞 Telefon Talepleri</h2>
          <p className="text-xs text-gray-500">
            İşletme sahipleri Google ile bağlanıp numaralarını doğruladı (cep: SMS kodu, sabit: e-posta). Onaylayınca numara firma kartında görünür.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUZGECLER.map(([s, etiket]) => (
            <button key={s} onClick={() => { setSuzgec(s); setYukleniyor(true); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${suzgec === s ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {etiket}
            </button>
          ))}
        </div>
      </div>

      {hata && <div className="mx-4 mt-3 text-sm text-red-600">{hata}</div>}

      {yukleniyor ? (
        <div className="p-6 text-sm text-gray-500">Yükleniyor…</div>
      ) : talepler.length === 0 ? (
        <div className="p-6 text-sm text-gray-500">Bu listede talep yok.</div>
      ) : (
        <ul className="divide-y">
          {talepler.map((t) => {
            const f = t.firmalar;
            const firmadaNumaraVar = !!(f?.telefon || f?.mobil_telefon);
            return (
              <li key={t.id} className="p-4 flex flex-col md:flex-row md:items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/firma/${t.firma_id}`} target="_blank" className="font-semibold text-[#1a3a6b] hover:underline">
                      {f?.ad || `Firma #${t.firma_id}`}
                    </Link>
                    {f?.sektor && <span className="text-xs text-gray-500">· {f.sektor}</span>}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${t.durum === 'onay_bekliyor' ? 'bg-amber-100 text-amber-800' : t.durum === 'onaylandi' ? 'bg-green-100 text-green-800' : t.durum === 'reddedildi' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {DURUM_ETIKET[t.durum]}
                    </span>
                  </div>
                  {f?.adres && <div className="text-xs text-gray-500">📍 {f.adres}</div>}
                  <div className="text-lg font-bold text-gray-800 tracking-wide">
                    {t.tur === 'cep' ? '📲' : '☎️'} {goster(t.telefon)}
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {t.tur === 'cep' ? 'Cep · SMS kodu ile doğrulandı' : 'Sabit hat · e-posta ile doğrulandı'}
                      {t.durum === 'dogrulama_bekliyor' && ' (henüz doğrulanmadı)'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    👤 {t.ad_soyad || '—'} · ✉️ {t.kullanici_email}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Talep: {tarih(t.created_at)} · Doğrulama: {tarih(t.dogrulandi_at)} · KVKK onayı: {tarih(t.kvkk_onay_at)} (sürüm {t.kvkk_surum})
                    {t.karar_at && <> · Karar: {tarih(t.karar_at)} ({t.karar_veren})</>}
                  </div>
                  {t.red_nedeni && <div className="text-xs text-red-600">Red nedeni: {t.red_nedeni}</div>}
                  {t.durum === 'onay_bekliyor' && (
                    <div className="text-[11px] text-gray-500">
                      Onaylarsanız: {t.tur === 'cep' ? 'Mobil telefon' : 'Telefon'} = {goster(t.telefon)}
                      {!f?.eposta && <> · E-posta = {t.kullanici_email}</>}
                      {!f?.kullanici_email && <> · Firma sahibi = {t.kullanici_email}</>}
                    </div>
                  )}
                  {t.durum === 'onay_bekliyor' && firmadaNumaraVar && (
                    <div className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 inline-block">
                      ⚠️ Bu firmaya bu arada numara eklenmiş: {[f?.telefon, f?.mobil_telefon].filter(Boolean).join(' / ')}
                    </div>
                  )}
                  {t.durum === 'onay_bekliyor' && f?.kullanici_email && f.kullanici_email !== t.kullanici_email && (
                    <div className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 inline-block">
                      ⚠️ Firmanın kayıtlı sahibi farklı bir hesap: {f.kullanici_email}
                    </div>
                  )}
                </div>

                {t.durum === 'onay_bekliyor' && (
                  <div className="flex flex-col gap-2 md:w-56">
                    {redId === t.id ? (
                      <>
                        <input value={redNeden} onChange={(e) => setRedNeden(e.target.value)} placeholder="Red nedeni (isteğe bağlı)"
                          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5" />
                        <div className="flex gap-2">
                          <button onClick={() => karar(t.id, 'reddet')} disabled={mesgulId === t.id}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60">Reddet</button>
                          <button onClick={() => { setRedId(null); setRedNeden(''); }} className="text-sm text-gray-500 px-2">Vazgeç</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button onClick={() => karar(t.id, 'onayla')} disabled={mesgulId === t.id}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-60">
                          ✅ Onayla ve yayınla
                        </button>
                        <button onClick={() => setRedId(t.id)} className="bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold px-3 py-1.5 rounded-lg">
                          Reddet
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
