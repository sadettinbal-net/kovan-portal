import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function PATCH(request: NextRequest) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Firma ID gerekli.' }, { status: 400 });

  const supabase = adminClient();

  const { data: firma, error: fetchError } = await supabase
    .from('firmalar')
    .select('id, onay_durumu, kullanici_email')
    .eq('id', id)
    .single();

  if (fetchError || !firma) {
    return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });
  }

  // kullanici_email varsa sahiplik kontrolü yap; yoksa veya null ise geç
  if (firma.kullanici_email && firma.kullanici_email !== user.email) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  }

  if (firma.onay_durumu !== 'reddedildi') {
    return NextResponse.json({ error: 'Sadece reddedilen firmalar yeniden gönderilebilir.' }, { status: 400 });
  }

  // Önce yeniden_gonderildi ile dene; kolon yoksa sadece onay_durumu güncelle
  const { error: updateError } = await supabase
    .from('firmalar')
    .update({ onay_durumu: 'beklemede', yeniden_gonderildi: true })
    .eq('id', id);

  if (updateError) {
    // yeniden_gonderildi kolonu yoksa sadece onay_durumu güncelle
    const { error: fallbackError } = await supabase
      .from('firmalar')
      .update({ onay_durumu: 'beklemede' })
      .eq('id', id);

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
