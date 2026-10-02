// İki ayrı etiket:
//  • ⭐ Müşteri Favorisi — otomatik: en az 3 görünür yorum ve %90+ olumlu (puan özeti veritabanında)
//  • 💎 Özel Firma (Sponsorlu) — yönetici elle, başlangıç ve bitiş tarihiyle verir; süre bitince kendiliğinden kalkar
// Süre kontrolü okuma anında yapılır (zamanlanmış iş yok): ozel_firma açık ve başlangıç ≤ şimdi < bitiş.

export const FAVORI_EN_AZ_YORUM = 3;
export const FAVORI_EN_AZ_OLUMLU = 90;

// Kart ve sayfa sorgularına eklenecek alanlar
export const OZEL_ALANLAR = 'ozel_firma, ozel_baslangic, ozel_bitis';

type OzelBilgi = { ozel_firma?: boolean | null; ozel_baslangic?: string | null; ozel_bitis?: string | null };
type PuanBilgi = { yorum_sayisi?: number | null; olumlu_yuzde?: number | null };

export function sponsorluMu(f: OzelBilgi, simdi = Date.now()): boolean {
  if (!f.ozel_firma || !f.ozel_baslangic || !f.ozel_bitis) return false;
  return new Date(f.ozel_baslangic).getTime() <= simdi && simdi < new Date(f.ozel_bitis).getTime();
}

export function musteriFavorisiMi(f: PuanBilgi): boolean {
  return (f.yorum_sayisi ?? 0) >= FAVORI_EN_AZ_YORUM && (f.olumlu_yuzde ?? 0) >= FAVORI_EN_AZ_OLUMLU;
}

// Supabase sorgusunu "süresi devam eden sponsorlu" firmalara daraltır
type SuzgecliSorgu = { eq(k: string, v: unknown): SuzgecliSorgu; lte(k: string, v: string): SuzgecliSorgu; gt(k: string, v: string): SuzgecliSorgu };
export function aktifSponsorlar<Q>(sorgu: Q): Q {
  const simdi = new Date().toISOString();
  return (sorgu as unknown as SuzgecliSorgu).eq('ozel_firma', true).lte('ozel_baslangic', simdi).gt('ozel_bitis', simdi) as unknown as Q;
}

// ─── Yönetici formu: tarih kutusu (YYYY-MM-DD) ↔ Türkiye saatiyle zaman ───
// Başlangıç günü 00:00'da başlar, bitiş günü 23:59:59'da biter (Türkiye UTC+3, yaz saati yok).
export const gunBaslangici = (gun: string) => `${gun}T00:00:00+03:00`;
export const gunSonu = (gun: string) => `${gun}T23:59:59+03:00`;
export function tarihKutusu(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(new Date(iso).getTime() + 3 * 3600_000).toISOString().slice(0, 10);
}

export type OzelDurum = { durum: 'yok' | 'baslamadi' | 'aktif' | 'doldu'; kalanGun?: number };
export function ozelDurum(f: OzelBilgi, simdi = Date.now()): OzelDurum {
  if (!f.ozel_firma || !f.ozel_baslangic || !f.ozel_bitis) return { durum: 'yok' };
  const bas = new Date(f.ozel_baslangic).getTime();
  const bit = new Date(f.ozel_bitis).getTime();
  if (simdi < bas) return { durum: 'baslamadi' };
  if (simdi >= bit) return { durum: 'doldu' };
  return { durum: 'aktif', kalanGun: Math.ceil((bit - simdi) / 86_400_000) };
}
