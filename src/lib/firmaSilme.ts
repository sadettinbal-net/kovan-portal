import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { adEslesiyor } from '@/lib/firmaAdEslesme';

// Firma kalıcı silme ve yayından kaldırma için ortak sunucu işlemleri.
// Tümü service role ile çalışır; çağıran route önce yetkiyi (admin veya firma sahibi) kontrol etmeli.

const BUCKET = 'firma-fotograflari';

export function servisIstemcisi() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type FotografliFirma = { fotograf_url: string | null; detay_fotograflar: string[] | null };

function fotografYollari(firma: FotografliFirma): string[] {
  return [firma.fotograf_url, ...(firma.detay_fotograflar || [])]
    .map(url => url?.split(`/${BUCKET}/`)[1])
    .filter((yol): yol is string => !!yol);
}

export type SilmeBilgisi = { ad: string; onay_durumu: string; yorum: number; ziyaret: number; fotograf: number };

// Silme penceresinde gösterilen bağlı kayıt sayıları
export async function silmeBilgisi(supabase: SupabaseClient, id: number): Promise<SilmeBilgisi | null> {
  const { data: firma } = await supabase
    .from('firmalar').select('ad, onay_durumu, fotograf_url, detay_fotograflar').eq('id', id).maybeSingle();
  if (!firma) return null;
  const [yorum, ziyaret] = await Promise.all([
    supabase.from('yorumlar').select('id', { count: 'exact', head: true }).eq('firma_id', id),
    supabase.from('ziyaretler').select('id', { count: 'exact', head: true }).eq('firma_id', id),
  ]);
  return {
    ad: firma.ad,
    onay_durumu: firma.onay_durumu,
    yorum: yorum.count ?? 0,
    ziyaret: ziyaret.count ?? 0,
    fotograf: fotografYollari(firma).length,
  };
}

// Firmayı kalıcı siler. Yorumlar veritabanında firmayla birlikte silinir (CASCADE),
// ziyaret kayıtları kalır (firma bağlantısı boşalır). Fotoğraflar ancak firma gerçekten silindikten sonra silinir.
export async function firmaKaliciSil(
  supabase: SupabaseClient,
  id: number,
  yazilanAd: unknown,
): Promise<{ hata: string; status: number } | { fotografHatasi: boolean }> {
  const { data: firma } = await supabase
    .from('firmalar').select('id, ad, fotograf_url, detay_fotograflar').eq('id', id).maybeSingle();
  if (!firma) return { hata: 'Firma bulunamadı.', status: 404 };
  if (!adEslesiyor(yazilanAd, firma.ad)) return { hata: 'Yazılan ad firma adıyla aynı değil. Firma silinmedi.', status: 400 };

  const { data: silinen, error } = await supabase.from('firmalar').delete().eq('id', id).select('id');
  if (error) return { hata: 'Firma silinemedi: ' + error.message, status: 500 };
  if (!silinen || silinen.length === 0) return { hata: 'Firma silinemedi (0 kayıt silindi). Fotoğraflara dokunulmadı.', status: 500 };

  const yollar = fotografYollari(firma);
  if (yollar.length === 0) return { fotografHatasi: false };
  const { error: depoHata } = await supabase.storage.from(BUCKET).remove(yollar);
  if (depoHata) console.error('Firma silindi ama fotoğraflar silinemedi:', id, yollar, depoHata);
  return { fotografHatasi: !!depoHata };
}
