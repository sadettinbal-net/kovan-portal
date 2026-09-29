import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_EMAILS } from '@/lib/admin';

export async function PATCH(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { id, islem } = await request.json();
  if (!id || !['onayla', 'reddet'].includes(islem)) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: firma } = await supabase
    .from('firmalar')
    .select('bekleyen_degisiklikler')
    .eq('id', id)
    .single();

  if (!firma) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

  if (islem === 'onayla') {
    if (!firma.bekleyen_degisiklikler) {
      return NextResponse.json({ error: 'Bekleyen değişiklik yok.' }, { status: 400 });
    }
    const { error } = await supabase.from('firmalar').update({
      ...firma.bekleyen_degisiklikler,
      bekleyen_degisiklikler: null,
      guncelleme_talep_tarihi: null,
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // reddet — sadece pending'i temizle
    const { error } = await supabase.from('firmalar').update({
      bekleyen_degisiklikler: null,
      guncelleme_talep_tarihi: null,
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
