// Sitenin adı, adresi ve iletişim bilgileri tek yerde.
// Canlı adres NEXT_PUBLIC_SITE_URL ortam değişkeninden gelir.

export const SITE_ADI = 'Kovan Portal';
export const SITE_SLOGAN = 'Türkiye Sanayi Firma Rehberi';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// GEÇİCİ: Kovan'a ait e-posta adresi belirlenince değiştirilecek
export const SITE_EPOSTA = 'info@umraniyesanayisitesi.com';
export const SITE_TELEFON = '0535 359 47 63';
export const SITE_KONUM = 'Türkiye';
