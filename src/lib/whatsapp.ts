// Firma WhatsApp alanı: Türkiye numarası (05xx..., 905xx..., +90 5xx...) veya WhatsApp adresi.
// Güvenlik için yalnızca aşağıdaki WhatsApp alan adlarına giden linkler kabul edilir.
const IZINLI_ALAN_ADLARI = ['wa.me', 'api.whatsapp.com', 'whatsapp.com', 'www.whatsapp.com'];

export const WHATSAPP_HATA = 'WhatsApp alanına sadece numara (05xx...) veya WhatsApp linki (wa.me, api.whatsapp.com, whatsapp.com) yazılabilir.';

// Numarayı wa.me'nin istediği biçime çevirir: 905321234567. Geçersizse null.
function numaraDuzelt(deger: string): string | null {
  if (!/^[\d\s()+\-.]+$/.test(deger)) return null;
  let rakamlar = deger.replace(/\D/g, '');
  if (rakamlar.startsWith('0090')) rakamlar = rakamlar.slice(2);
  if (rakamlar.length === 11 && rakamlar.startsWith('0')) rakamlar = '90' + rakamlar.slice(1);
  if (rakamlar.length === 10) rakamlar = '90' + rakamlar;
  return /^90\d{10}$/.test(rakamlar) ? rakamlar : null;
}

// Linki https'li tam adrese çevirir; WhatsApp dışı bir adresse null.
function linkDuzelt(deger: string): string | null {
  const adres = /^[a-z][a-z\d+.-]*:/i.test(deger) ? deger : 'https://' + deger;
  let url: URL;
  try { url = new URL(adres); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password || url.port) return null;
  if (!IZINLI_ALAN_ADLARI.includes(url.hostname.toLowerCase())) return null;
  url.protocol = 'https:';
  return url.toString();
}

// Formdan gelen değeri kontrol eder. Boşsa { deger: null }, geçersizse { hata }.
// Gizli işaret: -- yazılırsa boş kabul edilir.
export function whatsappKontrol(girdi: unknown): { deger: string | null; hata?: string } {
  if (girdi == null) return { deger: null };
  if (typeof girdi !== 'string') return { deger: null, hata: WHATSAPP_HATA };
  const deger = girdi.trim();
  if (!deger || deger === '--') return { deger: null };
  if (numaraDuzelt(deger)) return { deger };
  const link = linkDuzelt(deger);
  return link ? { deger: link } : { deger: null, hata: WHATSAPP_HATA };
}

// Butonun gideceği adres. Önce WhatsApp alanı, boşsa mobil telefonun ilk numarası kullanılır.
export function whatsappAdresi(whatsapp: string | null | undefined, mobilTelefon?: string | null): string | null {
  const deger = whatsapp?.trim();
  if (deger) {
    const numara = numaraDuzelt(deger);
    if (numara) return `https://wa.me/${numara}`;
    return linkDuzelt(deger);
  }
  const ilk = ilkNumara(mobilTelefon);
  const numara = ilk ? numaraDuzelt(ilk) : null;
  return numara ? `https://wa.me/${numara}` : null;
}

// Birden fazla numara "|" veya "," ile ayrılmış olabilir; ilkini döndürür.
export function ilkNumara(telefon: string | null | undefined): string {
  return (telefon ?? '').split(/[|,]/)[0].trim();
}

// Sadece cep numarası (905xx…) için WhatsApp adresi; sabit hatta WhatsApp olmadığından null döner.
export function cepWhatsappAdresi(telefon: string | null | undefined): string | null {
  const adres = whatsappAdresi(null, telefon);
  return adres && /^https:\/\/wa\.me\/905\d{9}$/.test(adres) ? adres : null;
}
