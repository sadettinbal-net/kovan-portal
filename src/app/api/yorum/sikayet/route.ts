import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { servisIstemcisi } from '@/lib/firmaSilme';
import { ayniEposta, SIKAYET_ACIKLAMA_EN_FAZLA, SIKAYET_SEBEPLERI } from '@/lib/yorumlar';

// Giriş yapmış üye (firma sahibi dahil) bir yorumu sebep seçerek şikâyet eder.
// Aynı kişi aynı yorumu bir kez şikâyet edebilir; kendi yorumunu ve gizli yorumu şikâyet edemez.
export async function POST(request: NextRequest) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });

  const { yorum_id, sebep, aciklama } = await request.json().catch(() => ({}));
  if (!Number.isInteger(yorum_id)) return NextResponse.json({ error: 'Yorum gerekli.' }, { status: 400 });
  if (!SIKAYET_SEBEPLERI.includes(sebep)) return NextResponse.json({ error: 'Bir sebep seçin.' }, { status: 400 });
  if (aciklama != null && typeof aciklama !== 'string') return NextResponse.json({ error: 'Geçersiz açıklama.' }, { status: 400 });
  const not = (aciklama ?? '').trim();
  if (not.length > SIKAYET_ACIKLAMA_EN_FAZLA) {
    return NextResponse.json({ error: `Açıklama en fazla ${SIKAYET_ACIKLAMA_EN_FAZLA} karakter olabilir.` }, { status: 400 });
  }

  const supabase = servisIstemcisi();
  const { data: yorum } = await supabase.from('yorumlar').select('id, firma_id, kullanici_email, gizli').eq('id', yorum_id).maybeSingle();
  if (!yorum || yorum.gizli) return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
  if (ayniEposta(yorum.kullanici_email, user.email)) {
    return NextResponse.json({ error: 'Kendi yorumunuzu şikâyet edemezsiniz.' }, { status: 400 });
  }
  const { data: firma } = await supabase.from('firmalar').select('onay_durumu').eq('id', yorum.firma_id).maybeSingle();
  if (firma?.onay_durumu !== 'onaylandi') return NextResponse.json({ error: 'Firma yayında değil.' }, { status: 400 });

  const { error } = await supabase.from('yorum_sikayetleri').insert({
    yorum_id,
    sikayet_eden_email: user.email.toLowerCase(),
    sebep,
    aciklama: not || null,
  });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Bu yorumu zaten şikâyet ettiniz.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
