import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';

export async function DELETE(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!yoneticiMi(user?.email)) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });

  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const { data, error } = await servisIstemcisi().from('yorumlar').delete().eq('id', id).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'Yorum bulunamadı (0 kayıt silindi).' }, { status: 404 });
  return NextResponse.json({ success: true });
}
