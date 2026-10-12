'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { SITE_TELEFON } from '@/lib/site';

// Telefonu olmayan firmanın detay sayfasında: işletme sahibi Google ile bağlanıp numarasını ekler.
// Cep → kişi ekrandaki kodu kendi WhatsApp'ından sitenin hattına gönderir; sabit hat → e-postaya onay bağlantısı.
// Numara yönetici onayından sonra görünür.

type Talep = {
  id: number;
  telefon: string;
  tur: 'cep' | 'sabit';
  durum: 'dogrulama_bekliyor' | 'onay_bekliyor' | 'onaylandi' | 'reddedildi' | 'iptal';
  red_nedeni: string | null;
  dogrulama_kodu: string | null;
};

type Kisi = { email: string; ad: string };

type Asama = 'kapali' | 'yukleniyor' | 'giris' | 'form' | 'eposta' | 'onayda' | 'onaylandi' | 'reddedildi';

function numaraTuru(deger: string): 'cep' | 'sabit' | null {
  let r = deger.replace(/\D/g, '');
  if (r.startsWith('0090')) r = r.slice(4);
  else if (r.startsWith('90') && r.length === 12) r = r.slice(2);
  else if (r.startsWith('0') && r.length === 11) r = r.slice(1);
  if (!/^[2-5]\d{9}$/.test(r)) return null;
  return r[0] === '5' ? 'cep' : 'sabit';
}

// Sitenin WhatsApp hattı (wa.me biçimi: 90XXXXXXXXXX)
const WA_HAT = (() => {
  const r = SITE_TELEFON.replace(/\D/g, '');
  return r.startsWith('0') ? '90' + r.slice(1) : r;
})();

function goster(t: string) {
  return t.length === 11 ? `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7, 9)} ${t.slice(9)}` : t;
}

const EPOSTA_SONUC: Record<string, { tur: 'iyi' | 'kotu'; metin: string }> = {
  dogrulandi: { tur: 'iyi', metin: 'E-posta onayınız alındı. Numaranız yönetici onayından sonra firmanızın kartında görünecek.' },
  'suresi-doldu': { tur: 'kotu', metin: 'Onay bağlantısının süresi dolmuş. Lütfen numaranızı yeniden girin.' },
  gecersiz: { tur: 'kotu', metin: 'Onay bağlantısı geçersiz ya da daha önce kullanılmış.' },
};

export default function TelefonEkleKutusu({ firmaId, firmaAd }: { firmaId: number; firmaAd: string }) {
  const [asama, setAsama] = useState<Asama>('kapali');
  const [kisi, setKisi] = useState<Kisi | null>(null);
  const [talep, setTalep] = useState<Talep | null>(null);
  const [adSoyad, setAdSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [kvkk, setKvkk] = useState(false);
  const [hata, setHata] = useState('');
  const [mesgul, setMesgul] = useState(false);
  const [testBaglanti, setTestBaglanti] = useState('');
  const [epostaSonuc, setEpostaSonuc] = useState<string | null>(null);

  const talebeGore = useCallback((t: Talep | null) => {
    setTalep(t);
    if (!t) return setAsama('form');
    if (t.durum === 'dogrulama_bekliyor') return setAsama('eposta');
    if (t.durum === 'onay_bekliyor') return setAsama('onayda');
    if (t.durum === 'onaylandi') return setAsama('onaylandi');
    if (t.durum === 'reddedildi') return setAsama('reddedildi');
    setAsama('form');
  }, []);

  const ac = useCallback(async () => {
    setAsama('yukleniyor');
    setHata('');
    const me = await fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!me?.user?.email) return setAsama('giris');
    const r = await fetch(`/api/telefon-talebi?firma_id=${firmaId}`).then((x) => x.json()).catch(() => null);
    const k: Kisi = { email: me.user.email, ad: r?.ad || me.user.name || '' };
    setKisi(k);
    setAdSoyad((v) => v || k.ad);
    talebeGore(r?.talep ?? null);
  }, [firmaId, talebeGore]);

  // Google girişinden dönüşte (?telefon=ac) kutu kendiliğinden açılır; e-posta onayından dönüşte sonuç gösterilir
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('telefon');
    if (!p) return;
    const z = setTimeout(() => {
      if (p === 'ac') void ac();
      else if (EPOSTA_SONUC[p]) {
        setEpostaSonuc(p);
        if (p === 'dogrulandi') void ac();
      }
      const u = new URL(window.location.href);
      u.searchParams.delete('telefon');
      window.history.replaceState(null, '', u.toString());
    }, 0);
    return () => clearTimeout(z);
  }, [ac]);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    if (!numaraTuru(telefon)) return setHata('Telefon numarası geçerli değil. Örnek: 0532 123 45 67 veya 0216 123 45 67');
    if (!kvkk) return setHata('Devam etmek için KVKK bilgilendirmesini kabul etmelisiniz.');
    setMesgul(true);
    const r = await fetch('/api/telefon-talebi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firma_id: firmaId, telefon, ad_soyad: adSoyad, kvkk: true }),
    });
    const d = await r.json().catch(() => ({}));
    setMesgul(false);
    if (!r.ok) return setHata(d.error || 'Bir hata oluştu.');
    setTestBaglanti(d.test_baglanti || '');
    talebeGore(d.talep);
  }

  function bastan() {
    setTalep(null);
    setTestBaglanti('');
    setHata('');
    setAsama('form');
  }

  const tur = numaraTuru(telefon);
  const girisAdresi = `/api/auth/google?next=${encodeURIComponent(`/firma/${firmaId}?telefon=ac`)}`;
  const sonuc = epostaSonuc ? EPOSTA_SONUC[epostaSonuc] : null;

  return (
    <div className="mb-3 rounded-xl border-2 border-dashed border-[#e8a020]/60 bg-amber-50/60 p-4" id="telefon-ekle">
      {sonuc && (
        <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${sonuc.tur === 'iyi' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
          {sonuc.metin}
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className="text-xl">📞</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[#1a3a6b] text-sm">Bu firmanın telefon numarası henüz eklenmemiş</div>

          {asama === 'kapali' && (
            <>
              <p className="text-xs text-gray-600 mt-1">
                <b>{firmaAd}</b> sizin işletmeniz mi? Numaranızı ekleyin, müşterileriniz size doğrudan ulaşsın. Ücretsizdir.
              </p>
              <button
                onClick={ac}
                className="mt-3 bg-[#e8a020] hover:bg-[#d08f15] text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                Telefon numarası ekle
              </button>
            </>
          )}

          {asama === 'yukleniyor' && <p className="text-xs text-gray-500 mt-2">Yükleniyor…</p>}

          {asama === 'giris' && (
            <div className="mt-2">
              <p className="text-xs text-gray-600">
                Numaranın gerçekten işletme sahibinden geldiğini bilmek için önce Google hesabınızla bağlanmanız gerekiyor.
                Google e-posta adresiniz firmanın e-posta bilgisi olarak kullanılır.
              </p>
              <a
                href={girisAdresi}
                className="mt-3 inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                </svg>
                Google ile bağlan
              </a>
            </div>
          )}

          {asama === 'form' && kisi && (
            <form onSubmit={gonder} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">E-posta (Google hesabınız)</label>
                <div className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 break-all">✉️ {kisi.email}</div>
                <p className="text-[11px] text-gray-500 mt-1">Onaylandığında firmanın e-posta bilgisi olarak da eklenir.</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1" htmlFor="tel-ad">Adınız soyadınız</label>
                <input
                  id="tel-ad"
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  maxLength={100}
                  className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#e8a020]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1" htmlFor="tel-no">Telefon numarası</label>
                <input
                  id="tel-no"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0532 123 45 67 veya 0216 123 45 67"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#e8a020]"
                />
                {tur && (
                  <p className="text-[11px] text-gray-600 mt-1">
                    {tur === 'cep'
                      ? '📲 Cep telefonu: sonraki adımda bu numaranın WhatsApp’ından bize kısa bir mesaj göndereceksiniz.'
                      : `☎️ Sabit hat: ${kisi.email} adresine onay bağlantısı göndereceğiz.`}
                  </p>
                )}
              </div>
              <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-0.5 accent-[#e8a020]" />
                <span>
                  <Link href="/kvkk-aydinlatma" target="_blank" className="text-[#1a3a6b] font-semibold underline">
                    KVKK Aydınlatma Metni
                  </Link>
                  ’ni okudum; telefon numaramın ve e-posta adresimin firma sayfasında yayınlanmasını kabul ediyorum.
                </span>
              </label>
              {hata && <div className="text-xs text-red-600">{hata}</div>}
              <button
                type="submit"
                disabled={mesgul}
                className="bg-[#1a3a6b] hover:bg-[#142d54] disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                {mesgul ? 'Gönderiliyor…' : tur === 'sabit' ? 'Onay e-postası gönder' : 'Devam et'}
              </button>
            </form>
          )}

          {asama === 'eposta' && talep && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-700">
                📧 <b>{kisi?.email}</b> adresine onay bağlantısı gönderdik. E-postadaki <b>“Numarayı onaylıyorum”</b> düğmesine tıklayın.
              </p>
              <p className="text-xs text-gray-500">Bağlantı 24 saat geçerlidir. Gelen kutunuzda yoksa “Spam / Gereksiz” klasörüne bakın.</p>
              {testBaglanti && (
                <div className="text-xs bg-yellow-100 border border-yellow-300 text-yellow-900 rounded-lg px-3 py-2 break-all">
                  🧪 <b>Deneme modu:</b> <a href={testBaglanti} className="underline">e-postadaki bağlantı</a>
                </div>
              )}
              <button type="button" onClick={bastan} className="text-xs text-gray-500 underline">Numarayı değiştir</button>
            </div>
          )}

          {asama === 'onayda' && talep && talep.tur === 'cep' && talep.dogrulama_kodu && (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-gray-700">
                Son adım: numaranın size ait olduğunu doğrulamak için <b>{goster(talep.telefon)}</b> numaralı telefonunuzdan
                WhatsApp ile bize aşağıdaki kodu gönderin.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-500">Doğrulama kodunuz</span>
                <span className="font-mono text-2xl font-bold tracking-[0.3em] text-[#1a3a6b] bg-white border border-gray-200 rounded-lg px-3 py-1">
                  {talep.dogrulama_kodu}
                </span>
              </div>
              <a
                href={`https://wa.me/${WA_HAT}?text=${encodeURIComponent(`Kovan Portal doğrulama kodu: ${talep.dogrulama_kodu}\nFirma: ${firmaAd}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2S21.8 6.6 21.8 12 17.4 21.8 12 21.8zM12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6C8 23.4 10 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0z" />
                </svg>
                WhatsApp ile doğrula
              </a>
              <p className="text-xs text-gray-500">
                Düğme WhatsApp’ı hazır mesajla açar, sadece “Gönder”e basmanız yeterli. Mesaj gelmezse sizi bu numaradan arayarak
                doğrularız. Kontrolden sonra numaranız firmanızın kartında yayınlanır.
              </p>
              <button type="button" onClick={bastan} className="text-xs text-gray-500 underline">Numarayı değiştir</button>
            </div>
          )}

          {asama === 'onayda' && talep && !(talep.tur === 'cep' && talep.dogrulama_kodu) && (
            <div className="mt-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              ✅ <b>{goster(talep.telefon)}</b> doğrulandı. Kısa süre içinde kontrol edilip firmanızın kartında yayınlanacak.
            </div>
          )}

          {asama === 'onaylandi' && talep && (
            <div className="mt-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              ✅ <b>{goster(talep.telefon)}</b> onaylandı. Sayfayı yenilediğinizde görünecek.
            </div>
          )}

          {asama === 'reddedildi' && talep && (
            <div className="mt-2 space-y-2">
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {goster(talep.telefon)} numarası onaylanmadı.{talep.red_nedeni ? ` Neden: ${talep.red_nedeni}` : ''}
              </div>
              <button type="button" onClick={bastan} className="text-xs text-[#1a3a6b] underline">Başka numara ile tekrar dene</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
