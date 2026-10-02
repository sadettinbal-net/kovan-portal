import type { SupabaseClient } from '@supabase/supabase-js';

// Puan/yorum kuralları. yorumlar tablosu açık anahtarla okunamaz/yazılamaz;
// tüm işlemler sunucuda service role ile yapılır, bu yüzden kurallar burada kontrol edilir.

export const YORUM_EN_AZ = 10;
export const YORUM_EN_FAZLA = 2000;

// Firmalar sıralamasında öne çıkma ve Özel Firmalar'a otomatik girme için gereken en az görünür yorum sayısı
export const ONE_CIKMA_EN_AZ_YORUM = 3;

// Sitede gösterilen alanlar (e-posta asla dışarı verilmez)
export const YORUM_ALANLARI = 'id, kullanici_ad, yorum, puan, created_at, guncelleme_tarihi';

export function puanYorumKontrol(puan: unknown, yorum: unknown): { puan: number; yorum: string } | { hata: string } {
  if (typeof puan !== 'number' || !Number.isInteger(puan) || puan < 1 || puan > 5) {
    return { hata: 'Puan 1 ile 5 arasında olmalı.' };
  }
  if (yorum != null && typeof yorum !== 'string') return { hata: 'Geçersiz yorum.' };
  const metin = (yorum ?? '').trim();
  if (metin && metin.length < YORUM_EN_AZ) return { hata: `Yorum yazacaksanız en az ${YORUM_EN_AZ} karakter olmalı.` };
  if (metin.length > YORUM_EN_FAZLA) return { hata: `Yorum en fazla ${YORUM_EN_FAZLA} karakter olabilir.` };
  return { puan, yorum: metin };
}

// Puan verilebilir mi: firma onaylı ve yayında olmalı, puan veren firmanın sahibi olmamalı.
export async function puanVerilebilirMi(
  supabase: SupabaseClient,
  firmaId: number,
  email: string,
): Promise<{ hata: string; status: number } | null> {
  const { data: firma } = await supabase
    .from('firmalar').select('onay_durumu, kullanici_email').eq('id', firmaId).maybeSingle();
  if (!firma || firma.onay_durumu !== 'onaylandi') {
    return { hata: 'Bu firma şu an yayında değil, puan verilemez.', status: 400 };
  }
  if (firma.kullanici_email && firma.kullanici_email.toLowerCase() === email.toLowerCase()) {
    return { hata: 'Kendi firmanıza puan veremezsiniz.', status: 403 };
  }
  return null;
}

export const ayniEposta = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();

// ─── Firma yanıtı ───────────────────────────────────────────────────────────
export const CEVAP_EN_AZ = 2;
export const CEVAP_EN_FAZLA = 1000;

// ─── Şikâyet ────────────────────────────────────────────────────────────────
export const SIKAYET_SEBEPLERI = ['hakaret', 'yaniltici', 'kisisel_bilgi', 'reklam', 'konu_disi', 'diger'] as const;
export type SikayetSebebi = typeof SIKAYET_SEBEPLERI[number];
export const SIKAYET_ACIKLAMA_EN_FAZLA = 500;

// Yönetici panelinde gösterilen Türkçe sebep adları (sitedeki adlar translations.ts'te)
export const SIKAYET_SEBEP_ADLARI: Record<SikayetSebebi, string> = {
  hakaret: 'Hakaret / küfür',
  yaniltici: 'Yanıltıcı / sahte',
  kisisel_bilgi: 'Kişisel bilgi içeriyor',
  reklam: 'Reklam / spam',
  konu_disi: 'Konu dışı',
  diger: 'Diğer',
};

// ─── Panel içi bildirim ─────────────────────────────────────────────────────
export type BildirimKapsami = 'yonetici' | 'sahip';

// Kişinin "yorumlara en son baktığı" zamandan sonra gelen yorumlar.
// Yönetici: tüm yorumlar (gizliler dahil). Firma sahibi: sadece kendi firmalarının görünür yorumları.
export async function yeniYorumlar(supabase: SupabaseClient, kapsam: BildirimKapsami, email: string, limit = 50) {
  const { data: gorulme } = await supabase
    .from('yorum_bildirim_gorulme').select('son_gorulme')
    .eq('kullanici_email', email.toLowerCase()).eq('kapsam', kapsam).maybeSingle();

  const alanlar = kapsam === 'yonetici'
    ? `${YORUM_ALANLARI}, firma_id, gizli, kullanici_email`
    : `${YORUM_ALANLARI}, firma_id`;
  let sorgu = supabase.from('yorumlar').select(alanlar, { count: 'exact' });
  let firmaAdlari = new Map<number, string>();

  if (kapsam === 'sahip') {
    // Tam eşleşme (ilike kullanılmaz: e-postadaki "_" joker karakter sayılırdı)
    const { data: firmalar } = await supabase.from('firmalar').select('id, ad')
      .in('kullanici_email', [...new Set([email, email.toLowerCase()])]);
    if (!firmalar?.length) return { sayi: 0, yorumlar: [], sahipMi: false };
    firmaAdlari = new Map(firmalar.map(f => [f.id, f.ad]));
    sorgu = sorgu.in('firma_id', firmalar.map(f => f.id)).eq('gizli', false);
  }
  if (gorulme?.son_gorulme) sorgu = sorgu.gt('created_at', gorulme.son_gorulme);

  const { data, count } = await sorgu.order('created_at', { ascending: false }).limit(limit);
  const yorumlar = (data || []) as unknown as Array<Record<string, unknown> & { firma_id: number }>;

  if (kapsam === 'yonetici' && yorumlar.length) {
    const ids = [...new Set(yorumlar.map(y => y.firma_id))];
    const { data: firmalar } = await supabase.from('firmalar').select('id, ad').in('id', ids);
    firmaAdlari = new Map((firmalar || []).map(f => [f.id, f.ad]));
  }
  return {
    sayi: count ?? 0,
    yorumlar: yorumlar.map(y => ({ ...y, firma_ad: firmaAdlari.get(y.firma_id) ?? '' })),
    sahipMi: true,
  };
}
