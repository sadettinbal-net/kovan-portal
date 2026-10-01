import type { Translations } from '@/lib/translations';

// İlan türleri (sadece sanayi siteleri için). `ad` veritabanında ilanlar.kategori olarak ve adreste ?tip= olarak kullanılır;
// bu yüzden her dilde aynı (Türkçe) kalır. Ekranda görünen ad `etiket` ile seçili dile çevrilir.
export const ILAN_KATEGORILERI = [
  { id: 'arac', ad: 'Araç İlanları', etiket: 'catVehicle' },
  { id: 'dukkan', ad: 'Satılık - Kiralık Dükkan', etiket: 'catShop' },
  { id: 'eleman', ad: 'Eleman İlanları', etiket: 'catJob' },
  { id: 'yedekparca-arayan', ad: 'Yedek Parça Arayanlar', etiket: 'catPartsWanted' },
  { id: 'yedekparca-satan', ad: 'Yedek Parça Ve Çıkma Ürün Satanlar', etiket: 'catPartsSelling' },
  { id: 'imalat', ad: 'Ürün İmalatı Yapanlar', etiket: 'catManufacturing' },
] as const satisfies readonly { id: string; ad: string; etiket: keyof Translations }[];

// Veritabanındaki/adresteki Türkçe addan seçili dildeki görünen ada
export function ilanKategoriEtiketi(ad: string, t: Translations) {
  const k = ILAN_KATEGORILERI.find((x) => x.ad === ad);
  return k ? (t[k.etiket] as string) : ad;
}
