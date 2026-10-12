import { NextRequest, NextResponse } from 'next/server';
import { servisIstemcisi } from '@/lib/firmaSilme';
import { SINIR, ozet } from '@/lib/telefonTalebi';

// Sabit hat: e-postadaki bağlantı tıklanınca talep yönetici onayına geçer.
// Bağlantının kendisi e-posta adresine erişimin kanıtıdır; ayrıca giriş istenmez.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t') || '';
  const geri = (firmaId: number | null, sonuc: string) =>
    NextResponse.redirect(new URL(firmaId ? `/firma/${firmaId}?telefon=${sonuc}` : `/?telefon=${sonuc}`, request.url));

  if (token.length < 20 || token.length > 100) return geri(null, 'gecersiz');

  const db = servisIstemcisi();
  const { data: t } = await db
    .from('telefon_talepleri')
    .select('id, firma_id, tur, durum, created_at')
    .eq('eposta_token_ozet', ozet(token))
    .maybeSingle();
  if (!t || t.tur !== 'sabit') return geri(null, 'gecersiz');
  if (t.durum === 'onay_bekliyor' || t.durum === 'onaylandi') return geri(t.firma_id, 'dogrulandi');
  if (t.durum !== 'dogrulama_bekliyor') return geri(t.firma_id, 'gecersiz');
  if (Date.now() - new Date(t.created_at).getTime() > SINIR.epostaGecerlilikSaat * 3600_000) {
    await db.from('telefon_talepleri').update({ durum: 'iptal' }).eq('id', t.id);
    return geri(t.firma_id, 'suresi-doldu');
  }

  await db
    .from('telefon_talepleri')
    .update({ durum: 'onay_bekliyor', dogrulandi_at: new Date().toISOString() })
    .eq('id', t.id)
    .eq('durum', 'dogrulama_bekliyor');
  return geri(t.firma_id, 'dogrulandi');
}
