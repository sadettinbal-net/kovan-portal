import { ILAN_KATEGORILERI } from '@/lib/ilanKategorileri';

// İlan alanlarının sunucu kuralları (ilan verme ve yönetici düzenlemesi aynı kuralları kullanır).

export const ILAN_GUNLUK_SINIR = 3;
export const ILAN_EN_FAZLA_FOTO = 10;
export const BASLIK_UZUNLUK = [5, 100] as const;
export const ACIKLAMA_UZUNLUK = [10, 3000] as const;
export const FIYAT_EN_FAZLA = 50;
export const AD_EN_FAZLA = 100;

const KATEGORI_ADLARI: readonly string[] = ILAN_KATEGORILERI.map((k) => k.ad);

// Türkiye numarası: +90 / 90 / 0 ile başlayabilir, boşluk-tire-parantez serbest;
// sonuçta alan kodu dahil 10 hane, ilk hane 2-5 (sabit hat veya cep). Geçerliyse "0XXXXXXXXXX" döner.
export function telefonDuzelt(deger: unknown): string | null {
  if (typeof deger !== 'string' || !/^[\d\s()+\-.]+$/.test(deger.trim())) return null;
  let r = deger.replace(/\D/g, '');
  if (r.startsWith('0090')) r = r.slice(4);
  else if (r.startsWith('90') && r.length === 12) r = r.slice(2);
  else if (r.startsWith('0') && r.length === 11) r = r.slice(1);
  return /^[2-5]\d{9}$/.test(r) ? '0' + r : null;
}

type Alanlar = { baslik?: unknown; aciklama?: unknown; fiyat?: unknown; kategori?: unknown; telefon?: unknown; ilan_veren_ad?: unknown };
export type GecerliAlanlar = { baslik: string; aciklama: string; fiyat: string | null; kategori: string; telefon: string; ilan_veren_ad?: string };

const metin = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

// tumu=true: ilan verirken bütün zorunlu alanlar istenir. false: yönetici düzenlemesinde sadece gelen alanlar kontrol edilir.
export function ilanAlanlariKontrol(g: Alanlar, tumu: boolean): { alanlar: Partial<GecerliAlanlar> } | { hata: string } {
  const sonuc: Partial<GecerliAlanlar> = {};
  const var_ = (k: keyof Alanlar) => tumu || k in g;

  if (var_('baslik')) {
    const b = metin(g.baslik);
    if (b.length < BASLIK_UZUNLUK[0] || b.length > BASLIK_UZUNLUK[1]) return { hata: `Başlık ${BASLIK_UZUNLUK[0]}-${BASLIK_UZUNLUK[1]} karakter olmalı.` };
    sonuc.baslik = b;
  }
  if (var_('aciklama')) {
    const a = metin(g.aciklama);
    if (a.length < ACIKLAMA_UZUNLUK[0] || a.length > ACIKLAMA_UZUNLUK[1]) return { hata: `Açıklama ${ACIKLAMA_UZUNLUK[0]}-${ACIKLAMA_UZUNLUK[1]} karakter olmalı.` };
    sonuc.aciklama = a;
  }
  if (var_('fiyat')) {
    const f = metin(g.fiyat);
    if (f.length > FIYAT_EN_FAZLA) return { hata: `Fiyat en fazla ${FIYAT_EN_FAZLA} karakter olabilir.` };
    sonuc.fiyat = f || null;
  }
  if (var_('kategori')) {
    const k = metin(g.kategori);
    if (!KATEGORI_ADLARI.includes(k)) return { hata: 'Geçerli bir ilan türü seçin.' };
    sonuc.kategori = k;
  }
  if (var_('telefon')) {
    const t = telefonDuzelt(g.telefon);
    if (!t) return { hata: 'Geçerli bir telefon numarası yazın (örn. 0532 123 45 67 veya 0216 123 45 67).' };
    sonuc.telefon = t;
  }
  if ('ilan_veren_ad' in g) {
    const ad = metin(g.ilan_veren_ad);
    if (!ad || ad.length > AD_EN_FAZLA) return { hata: `İlan veren adı 1-${AD_EN_FAZLA} karakter olmalı.` };
    sonuc.ilan_veren_ad = ad;
  }
  return { alanlar: sonuc };
}
