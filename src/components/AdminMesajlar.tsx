'use client';

import { useCallback, useEffect, useState } from 'react';

// Yönetici paneli "📨 Reklam Mesajları" sekmesi: iletişim formundan gelen mesajlar.
// Varsayılan Reklam Ver'den gelenler; "Genel" ve "Tümü" ile diğer mesajlar da görülebilir.

// "🛑 Kaldırma" süzgecinde firma kartlarından gelen kaldırma/düzeltme talepleri; firma tek tıkla yayından kaldırılabilir.

type Mesaj = { id: number; ad_soyad: string; telefon: string | null; eposta: string | null; mesaj: string; okundu: boolean; konu: 'reklam' | 'genel' | 'kaldirma'; firma_id: number | null; created_at: string };
type Suzgec = 'reklam' | 'genel' | 'kaldirma' | 'tumu';
type FirmaOzet = Record<number, { ad: string; onay_durumu: string }>;

export default function AdminMesajlar({ onSayi, onFirmaDuzenle }: { onSayi: (n: number) => void; onFirmaDuzenle?: (firmaId: number) => void }) {
  const [suzgec, setSuzgec] = useState<Suzgec>('reklam');
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [firmalar, setFirmalar] = useState<FirmaOzet>({});
  const [okunmamis, setOkunmamis] = useState({ reklam: 0, genel: 0, kaldirma: 0 });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [silId, setSilId] = useState<number | null>(null);
  const [hata, setHata] = useState('');

  const yukle = useCallback(async (s: Suzgec) => {
    const res = await fetch(`/api/admin/mesajlar?konu=${s}`);
    const data = await res.json();
    if (res.ok) {
      setMesajlar(data.mesajlar);
      setFirmalar(data.firmalar || {});
      setOkunmamis(data.okunmamis);
      onSayi(data.okunmamis.reklam + (data.okunmamis.kaldirma || 0));
    } else {
      setHata(data.error || 'Mesajlar yüklenemedi.');
    }
    setYukleniyor(false);
  }, [onSayi]);

  useEffect(() => { yukle(suzgec); }, [yukle, suzgec]);

  async function islem(yontem: 'PATCH' | 'DELETE', govde: Record<string, unknown>) {
    setHata('');
    const res = await fetch('/api/admin/mesajlar', { method: yontem, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) });
    if (!res.ok) setHata((await res.json()).error || 'İşlem başarısız.');
    setSilId(null);
    yukle(suzgec);
  }

  // Talep edilen firmayı yayından kaldır / yayına geri al (firma silinmez)
  async function firmaDurum(firmaId: number, durum: 'pasif' | 'onaylandi') {
    setHata('');
    const res = await fetch('/api/admin/firma-durum', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: firmaId, durum }) });
    if (!res.ok) setHata((await res.json()).error || 'Firma durumu değiştirilemedi.');
    yukle(suzgec);
  }

  const dugme = (s: Suzgec, etiket: string, sayi?: number) => (
    <button onClick={() => { setSuzgec(s); setYukleniyor(true); }}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${suzgec === s ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
      {etiket}
      {!!sayi && <span className="bg-red-500 text-white px-1.5 rounded-full">{sayi}</span>}
    </button>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-[#1a3a6b]">📨 Mesajlar ve Talepler</h2>
          <p className="text-xs text-gray-500">Reklam başvuruları, firma kaldırma/düzeltme talepleri ve diğer iletişim mesajları.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dugme('reklam', '📢 Reklam', okunmamis.reklam)}
          {dugme('kaldirma', '🛑 Kaldırma', okunmamis.kaldirma)}
          {dugme('genel', '✉️ Genel', okunmamis.genel)}
          {dugme('tumu', 'Tümü')}
        </div>
      </div>
      {hata && <p className="px-4 py-2 text-sm bg-red-50 text-red-700">{hata}</p>}
      {yukleniyor ? (
        <p className="p-6 text-center text-sm text-gray-400">Yükleniyor...</p>
      ) : mesajlar.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400">Mesaj yok.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {mesajlar.map(m => (
            <div key={m.id} className={`px-4 py-3 ${m.okundu ? '' : 'bg-[#f0f4fa]'}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {!m.okundu && <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white font-semibold">Yeni</span>}
                <span className={`px-1.5 py-0.5 rounded-full font-semibold ${m.konu === 'reklam' ? 'bg-[#fff1d6] text-[#a8680c]' : m.konu === 'kaldirma' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {m.konu === 'reklam' ? '📢 Reklam' : m.konu === 'kaldirma' ? '🛑 Kaldırma/Düzeltme' : '✉️ Genel'}
                </span>
                <span className="font-semibold text-gray-800 text-sm">{m.ad_soyad}</span>
                {m.telefon && <a href={`tel:${m.telefon}`} className="text-[#1a3a6b] hover:underline">📞 {m.telefon}</a>}
                {m.eposta && <a href={`mailto:${m.eposta}`} className="text-[#1a3a6b] hover:underline break-all">✉️ {m.eposta}</a>}
                <span className="text-gray-400 ml-auto">{new Date(m.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              {m.firma_id && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <a href={`/firma/${m.firma_id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1a3a6b] hover:underline">
                    🏢 {firmalar[m.firma_id]?.ad || `Firma #${m.firma_id}`} ↗
                  </a>
                  {firmalar[m.firma_id] && onFirmaDuzenle && (
                    <button onClick={() => onFirmaDuzenle(m.firma_id!)} className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#1a3a6b] font-semibold">✏️ Firmayı düzenle</button>
                  )}
                  {!firmalar[m.firma_id] ? (
                    <span className="text-gray-400">(kayıt bulunamadı)</span>
                  ) : firmalar[m.firma_id].onay_durumu === 'pasif' ? (
                    <>
                      <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Yayında değil</span>
                      <button onClick={() => firmaDurum(m.firma_id!, 'onaylandi')} className="px-2.5 py-1 rounded bg-green-50 hover:bg-green-100 text-green-700 font-semibold">↩ Yayına geri al</button>
                    </>
                  ) : (
                    <button onClick={() => firmaDurum(m.firma_id!, 'pasif')} className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold">⏸ Yayından kaldır</button>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-line">{m.mesaj}</p>
              <div className="flex gap-2 mt-2 text-xs">
                <button onClick={() => islem('PATCH', { id: m.id, okundu: !m.okundu })} className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
                  {m.okundu ? 'Okunmadı yap' : '✓ Okundu'}
                </button>
                {silId === m.id ? (
                  <>
                    <span className="text-gray-600 self-center">Silinsin mi?</span>
                    <button onClick={() => islem('DELETE', { id: m.id })} className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white">Evet, sil</button>
                    <button onClick={() => setSilId(null)} className="px-2.5 py-1 rounded bg-gray-100 text-gray-700">İptal</button>
                  </>
                ) : (
                  <button onClick={() => setSilId(m.id)} className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600">🗑️ Sil</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
