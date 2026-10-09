import type { SupabaseClient } from '@supabase/supabase-js';

// Firma kategorileri firma_kategorileri tablosunda tutulur (herkes okuyabilir, yazma sadece /api/admin/kategoriler ile).
// Kategori tipleri ile firmalar.firma_tipi değerleri farklı adlandırılmış; çeviri aşağıda.
export type KategoriTipi = 'sanayi_sitesi' | 'sanayi_disi' | 'kurumsal';
export type FirmaTipi = 'siteli' | 'sitesiz' | 'kurumsal';

export type FirmaKategorisi = {
  id: number;
  ad: string;
  tip: KategoriTipi;
  ust_kategori_id: number | null;
  sira: number;
  aktif: boolean;
};

export const KATEGORI_TIPI: Record<FirmaTipi, KategoriTipi> = {
  siteli: 'sanayi_sitesi',
  sitesiz: 'sanayi_disi',
  kurumsal: 'kurumsal',
};
export const FIRMA_TIPI: Record<KategoriTipi, FirmaTipi> = {
  sanayi_sitesi: 'siteli',
  sanayi_disi: 'sitesiz',
  kurumsal: 'kurumsal',
};
export const TIP_ADI: Record<KategoriTipi, string> = {
  sanayi_sitesi: '🏗️ Sanayi Sitesi',
  sanayi_disi: '🏪 Sanayi Dışı',
  kurumsal: '🏢 Kurumsal',
};
const TIP_SIRASI: KategoriTipi[] = ['sanayi_sitesi', 'sanayi_disi', 'kurumsal'];

const sirala = (a: FirmaKategorisi, b: FirmaKategorisi) =>
  TIP_SIRASI.indexOf(a.tip) - TIP_SIRASI.indexOf(b.tip) || a.sira - b.sira || a.ad.localeCompare(b.ad, 'tr');

// Aktif kategoriler; tip, sıra ve ada göre sıralı
export async function aktifKategoriler(db: SupabaseClient): Promise<FirmaKategorisi[]> {
  const { data } = await db.from('firma_kategorileri').select('id, ad, tip, ust_kategori_id, sira, aktif').eq('aktif', true);
  return ((data || []) as FirmaKategorisi[]).sort(sirala);
}

// Bir tipin ana kategorileri ve altları. Alt kategorisi olmayan ana kategori kendisi seçilebilir.
export function kategoriGruplari(kategoriler: FirmaKategorisi[], tip: KategoriTipi) {
  const tiptekiler = kategoriler.filter((k) => k.tip === tip);
  return tiptekiler
    .filter((k) => !k.ust_kategori_id)
    .sort(sirala)
    .map((ana) => ({ ana, altlar: tiptekiler.filter((a) => a.ust_kategori_id === ana.id).sort(sirala) }));
}

// Bir kategori adına (ana kategoriyse altlarıyla birlikte) karşılık gelen kategori numaraları
export function adinKategoriIdleri(kategoriler: FirmaKategorisi[], ad: string, tip?: KategoriTipi) {
  const buyukAd = ad.toLocaleUpperCase('tr-TR');
  const eslesen = kategoriler.filter((k) => k.ad.toLocaleUpperCase('tr-TR') === buyukAd && (!tip || k.tip === tip));
  const idler = new Set(eslesen.map((k) => k.id));
  for (const k of kategoriler) if (k.ust_kategori_id && idler.has(k.ust_kategori_id)) idler.add(k.id);
  return Array.from(idler);
}

// Sağlık sayfalarındaki 112 uyarısı: SAĞLIK ana kategorisi ve altları numarayla tanınır (ad karşılaştırması yok)
export const SAGLIK_KATEGORI_ID = 75;
export const AMBULANS_KATEGORI_ID = 138;
export type SaglikUyarisi = 'saglik' | 'ambulans' | null;

// Listede seçilen kategori numaralarının hepsi sağlıktansa uyarı türünü döner
export function saglikUyarisi(kategoriler: Pick<FirmaKategorisi, 'id' | 'ust_kategori_id'>[], idler: number[]): SaglikUyarisi {
  if (!idler.length) return null;
  const saglikMi = (id: number) =>
    id === SAGLIK_KATEGORI_ID || kategoriler.find((k) => k.id === id)?.ust_kategori_id === SAGLIK_KATEGORI_ID;
  if (!idler.every(saglikMi)) return null;
  return idler.every((id) => id === AMBULANS_KATEGORI_ID) ? 'ambulans' : 'saglik';
}

// Tek firmanın kategorisi için uyarı türü (firma detay sayfaları)
export async function firmaSaglikUyarisi(db: SupabaseClient, kategoriId: number | null | undefined): Promise<SaglikUyarisi> {
  if (!kategoriId) return null;
  const { data } = await db.from('firma_kategorileri').select('id, ust_kategori_id').eq('id', kategoriId).maybeSingle();
  return data ? saglikUyarisi([data], [kategoriId]) : null;
}

// Sektör yazısından kategori bul (sunucuda, firma kaydı/düzenlemesi sırasında). Önce aynı tiptekine bakar.
export async function sektordenKategoriBul(db: SupabaseClient, sektor: string, firmaTipi?: string | null) {
  const { data } = await db.from('firma_kategorileri').select('id, ad, tip, ust_kategori_id').ilike('ad', sektor.trim());
  const adaylar = ((data || []) as Pick<FirmaKategorisi, 'id' | 'ad' | 'tip' | 'ust_kategori_id'>[]).filter(
    (k) => k.ad.toLocaleUpperCase('tr-TR') === sektor.trim().toLocaleUpperCase('tr-TR')
  );
  const tip = firmaTipi && firmaTipi in KATEGORI_TIPI ? KATEGORI_TIPI[firmaTipi as FirmaTipi] : null;
  return adaylar.find((k) => k.tip === tip) ?? (tip ? null : adaylar[0] ?? null);
}
