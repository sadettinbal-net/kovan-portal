import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { servisIstemcisi } from '@/lib/firmaSilme';
import { GORUNUM_ALANLARI, SINIR, ozetEsit } from '@/lib/telefonTalebi';

// Cep numarası için SMS kodunu doğrular: { id, kod }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });

  const { id, kod } = await request.json().catch(() => ({}));
  if (!Number.isInteger(id) || typeof kod !== 'string' || !/^\d{6}$/.test(kod.trim())) {
    return NextResponse.json({ error: 'Kod 6 haneli olmalı.' }, { status: 400 });
  }

  const db = servisIstemcisi();
  const { data: t } = await db
    .from('telefon_talepleri')
    .select('id, kullanici_email, tur, durum, kod_ozet, kod_gecerlilik, kod_deneme')
    .eq('id', id)
    .maybeSingle();
  if (!t || t.kullanici_email !== user.email.toLowerCase() || t.tur !== 'cep') {
    return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
  }
  if (t.durum !== 'dogrulama_bekliyor') return NextResponse.json({ error: 'Bu talep artık doğrulama beklemiyor.' }, { status: 409 });
  if (!t.kod_gecerlilik || new Date(t.kod_gecerlilik) < new Date()) {
    return NextResponse.json({ error: 'Kodun süresi doldu. "Kodu tekrar gönder" ile yeni kod isteyin.' }, { status: 410 });
  }

  if (!ozetEsit(kod.trim(), t.kod_ozet)) {
    const deneme = t.kod_deneme + 1;
    const bitti = deneme >= SINIR.kodDeneme;
    await db.from('telefon_talepleri').update({ kod_deneme: deneme, ...(bitti ? { durum: 'iptal' } : {}) }).eq('id', id);
    return NextResponse.json(
      { error: bitti ? 'Çok fazla yanlış kod girildi, talep iptal edildi. Baştan başlayabilirsiniz.' : `Kod yanlış. Kalan deneme: ${SINIR.kodDeneme - deneme}` },
      { status: 400 },
    );
  }

  const { data: talep, error } = await db
    .from('telefon_talepleri')
    .update({ durum: 'onay_bekliyor', dogrulandi_at: new Date().toISOString(), kod_ozet: null })
    .eq('id', id)
    .eq('durum', 'dogrulama_bekliyor')
    .select(GORUNUM_ALANLARI)
    .single();
  if (error || !talep) return NextResponse.json({ error: error?.message || 'Güncellenemedi.' }, { status: 500 });
  return NextResponse.json({ talep });
}
