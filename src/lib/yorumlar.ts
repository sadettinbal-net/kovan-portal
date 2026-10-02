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
