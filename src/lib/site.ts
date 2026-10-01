// Sitenin adı, adresi ve iletişim bilgileri tek yerde.
// Canlı adres NEXT_PUBLIC_SITE_URL ortam değişkeninden gelir.

export const SITE_ADI = 'Kovan Portal';
export const SITE_SLOGAN = 'Türkiye Sanayi Firma Rehberi';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Sitede görünen iletişim adresi. Bu adrese gelen postalar alan adı ayarlarından SITE_EPOSTA_YONLENDIRME adresine yönlendirilmeli.
export const SITE_EPOSTA = 'info@kovanportal.com';
// İletişim formu bildirimleri doğrudan buraya gönderilir
export const SITE_EPOSTA_YONLENDIRME = 'sadettinbal@gmail.com';
export const SITE_TELEFON = '0535 359 47 63';
export const SITE_KONUM = 'Türkiye';
