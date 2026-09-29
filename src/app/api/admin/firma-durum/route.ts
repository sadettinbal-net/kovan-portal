import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_EMAILS } from '@/lib/admin';

export async function PATCH(request: NextRequest) {
  // Sadece admin erişebilir
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { id, durum } = await request.json();
  if (!id || !['onaylandi', 'reddedildi'].includes(durum)) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  if (durum === 'reddedildi') {
    const { data: firma } = await supabase
      .from('firmalar')
      .select('yeniden_gonderildi')
      .eq('id', id)
      .single();

    if (firma?.yeniden_gonderildi) {
      const { error } = await supabase.from('firmalar').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true, silindi: true });
    }
  }

  const { error } = await supabase
    .from('firmalar')
    .update({ onay_durumu: durum })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
