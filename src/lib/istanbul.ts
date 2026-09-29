// İstanbul ilçelerinin yakası (sanayi sitelerini Anadolu / Avrupa yakası diye gruplamak için)
const AVRUPA_YAKASI = new Set([
  'ARNAVUTKÖY', 'AVCILAR', 'BAĞCILAR', 'BAHÇELİEVLER', 'BAKIRKÖY', 'BAŞAKŞEHİR', 'BAYRAMPAŞA', 'BEŞİKTAŞ',
  'BEYLİKDÜZÜ', 'BEYOĞLU', 'BÜYÜKÇEKMECE', 'ÇATALCA', 'ESENLER', 'ESENYURT', 'EYÜPSULTAN', 'FATİH',
  'GAZİOSMANPAŞA', 'GÜNGÖREN', 'KAĞITHANE', 'KÜÇÜKÇEKMECE', 'SARIYER', 'SİLİVRİ', 'SULTANGAZİ', 'ŞİŞLİ', 'ZEYTİNBURNU',
]);
const ANADOLU_YAKASI = new Set([
  'ADALAR', 'ATAŞEHİR', 'BEYKOZ', 'ÇEKMEKÖY', 'KADIKÖY', 'KARTAL', 'MALTEPE', 'PENDİK', 'SANCAKTEPE',
  'SULTANBEYLİ', 'ŞİLE', 'TUZLA', 'ÜMRANİYE', 'ÜSKÜDAR',
]);

export type Yaka = 'Anadolu Yakası' | 'Avrupa Yakası';

export function istanbulMu(il: string | null | undefined) {
  return !!il && il.toLocaleUpperCase('tr-TR') === 'İSTANBUL';
}

export function istanbulYakasi(ilce: string | null | undefined): Yaka | null {
  if (!ilce) return null;
  const buyuk = ilce.toLocaleUpperCase('tr-TR');
  if (ANADOLU_YAKASI.has(buyuk)) return 'Anadolu Yakası';
  if (AVRUPA_YAKASI.has(buyuk)) return 'Avrupa Yakası';
  return null;
}
