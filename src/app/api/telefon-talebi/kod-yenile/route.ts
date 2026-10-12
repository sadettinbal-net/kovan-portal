import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { servisIstemcisi } from '@/lib/firmaSilme';
import { SINIR, ozet, smsGonder, telefonGoster, testModu, yeniKod } from '@/lib/telefonTalebi';

// Cep numarasına yeni SMS kodu: { id }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });

  const { id } = await request.json().catch(() => ({}));
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Geçersiz talep.' }, { status: 400 });

  const db = servisIstemcisi();
  const { data: t } = await db
    .from('telefon_talepleri')
    .select('id, kullanici_email, telefon, tur, durum, kod_gecerlilik, kod_gonderim')
    .eq('id', id)
    .maybeSingle();
  if (!t || t.kullanici_email !== user.email.toLowerCase() || t.tur !== 'cep') {
    return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
  }
  if (t.durum !== 'dogrulama_bekliyor') return NextResponse.json({ error: 'Bu talep artık doğrulama beklemiyor.' }, { status: 409 });
  if (t.kod_gonderim > SINIR.kodYenileme) {
    return NextResponse.json({ error: 'Kod gönderme hakkınız doldu. Lütfen daha sonra tekrar deneyin.' }, { status: 429 });
  }
  // Son gönderimden bu yana en az 60 sn (geçerlilik bitişinden geriye hesaplanır)
  const sonGonderim = t.kod_gecerlilik ? new Date(t.kod_gecerlilik).getTime() - SINIR.kodGecerlilikDk * 60_000 : 0;
  const bekle = Math.ceil((sonGonderim + SINIR.kodYenilemeAraligiSn * 1000 - Date.now()) / 1000);
  if (bekle > 0) return NextResponse.json({ error: `Yeni kod için ${bekle} saniye bekleyin.` }, { status: 429 });

  const kod = yeniKod();
  await db.from('telefon_talepleri').update({
    kod_ozet: ozet(kod),
    kod_gecerlilik: new Date(Date.now() + SINIR.kodGecerlilikDk * 60_000).toISOString(),
    kod_gonderim: t.kod_gonderim + 1,
    kod_deneme: 0,
  }).eq('id', id);
  await smsGonder(t.telefon, `Kovan Portal dogrulama kodunuz: ${kod}. ${SINIR.kodGecerlilikDk} dakika gecerlidir.`);

  return NextResponse.json({
    mesaj: `${telefonGoster(t.telefon)} numarasına yeni kod gönderildi.`,
    ...(testModu() ? { test_kod: kod } : {}),
  });
}
