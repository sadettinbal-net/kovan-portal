import crypto from 'crypto';
import { telefonDuzelt } from '@/lib/ilanKurallari';
import { htmlKacis } from '@/lib/htmlKacis';
import { SITE_URL } from '@/lib/site';

// Telefon talebi: işletme sahibi, telefonu olmayan firmasının detay sayfasından numara ekler.
// Cep numarasına SMS kodu, sabit hatta ise Google hesabının e-postasına onay bağlantısı gider.
// Doğrulanan talep yönetici onayına düşer; onaylanınca numara firma kartında görünür.

export const KVKK_SURUM = '2026-10-12';

export const SINIR = {
  epostaGunluk: 5, // bir hesap 24 saatte en fazla bu kadar talep açar
  telefonGunluk: 3, // aynı numara 24 saatte en fazla bu kadar talepte kullanılır
  kodGecerlilikDk: 10,
  kodDeneme: 5, // bu kadar yanlış kod → talep iptal
  kodYenileme: 3,
  kodYenilemeAraligiSn: 60,
  epostaGecerlilikSaat: 24,
};

export type TalepDurumu = 'dogrulama_bekliyor' | 'onay_bekliyor' | 'onaylandi' | 'reddedildi' | 'iptal';
export type TalepTuru = 'cep' | 'sabit';

export function numaraVeTur(deger: unknown): { telefon: string; tur: TalepTuru } | null {
  const t = telefonDuzelt(deger);
  if (!t) return null;
  return { telefon: t, tur: t[1] === '5' ? 'cep' : 'sabit' };
}

export function telefonGoster(t: string) {
  // 0XXXXXXXXXX → 0XXX XXX XX XX
  return t.length === 11 ? `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7, 9)} ${t.slice(9)}` : t;
}

function sir() {
  const s = process.env.TELEFON_DOGRULAMA_SIRRI || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('TELEFON_DOGRULAMA_SIRRI tanımlı değil');
  return s;
}

export function ozet(deger: string) {
  return crypto.createHmac('sha256', sir()).update(deger).digest('hex');
}

export function ozetEsit(deger: string, kayitli: string | null) {
  if (!kayitli) return false;
  const a = Buffer.from(ozet(deger), 'hex');
  const b = Buffer.from(kayitli, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function yeniKod() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function yeniToken() {
  return crypto.randomBytes(32).toString('base64url');
}

// Test modu: SMS sağlayıcısı henüz seçilmedi. Canlıda değilsek kod / bağlantı ekranda gösterilir.
export function testModu() {
  return process.env.NODE_ENV !== 'production' || process.env.TELEFON_TEST_MODU === '1';
}

// SMS gönderimi. Sağlayıcı (Netgsm, İleti Merkezi vb.) seçilince burası doldurulacak.
export async function smsGonder(telefon: string, mesaj: string): Promise<{ gonderildi: boolean }> {
  if (!process.env.SMS_SAGLAYICI) {
    console.info(`[SMS test modu] ${telefon}: ${mesaj}`);
    return { gonderildi: false };
  }
  // TODO: sağlayıcı entegrasyonu
  console.warn(`SMS sağlayıcısı "${process.env.SMS_SAGLAYICI}" henüz bağlanmadı.`);
  return { gonderildi: false };
}

export function siteKoku(istekUrl: string) {
  const o = new URL(istekUrl).origin;
  return o.includes('localhost') ? o : SITE_URL;
}

export async function onayEpostasiGonder(kok: string, alici: string, firmaAd: string, telefon: string, token: string) {
  const baglanti = `${kok}/api/telefon-talebi/eposta-onay?t=${encodeURIComponent(token)}`;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[E-posta test modu] ${alici}: ${baglanti}`);
    return { baglanti, gonderildi: false };
  }
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px">
      <h2 style="color:#b45309">Kovan Portal – Telefon numarası onayı</h2>
      <p><b>${htmlKacis(firmaAd)}</b> firması için <b>${htmlKacis(telefonGoster(telefon))}</b> numarasını eklemek istediniz.</p>
      <p>Bu isteği siz yaptıysanız aşağıdaki düğmeye tıklayın. Bağlantı ${SINIR.epostaGecerlilikSaat} saat geçerlidir.</p>
      <p><a href="${baglanti}" style="display:inline-block;background:#f59e0b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Numarayı onaylıyorum</a></p>
      <p style="color:#666;font-size:12px">Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; numara eklenmez.</p>
    </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: alici,
      subject: `Kovan Portal – ${firmaAd.slice(0, 60).replace(/[\r\n]+/g, ' ')} telefon onayı`,
      html,
    }),
  }).catch((e) => {
    console.error('Telefon onay e-postası gönderilemedi:', e);
    return null;
  });
  return { baglanti, gonderildi: !!r?.ok };
}

export function istemciIp(headers: Headers) {
  return (headers.get('x-forwarded-for') || '').split(',')[0].trim() || headers.get('x-real-ip') || null;
}

// Kullanıcıya dönen talep görünümü (özetler, ip vb. gizli alanlar hariç)
export type TalepGorunumu = {
  id: number;
  telefon: string;
  tur: TalepTuru;
  durum: TalepDurumu;
  red_nedeni: string | null;
  created_at: string;
};

export const GORUNUM_ALANLARI = 'id, telefon, tur, durum, red_nedeni, created_at';
