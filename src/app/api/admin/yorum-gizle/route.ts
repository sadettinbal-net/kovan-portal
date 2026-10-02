import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';

// Yönetici: yorumu gizle / tekrar göster. Gizli yorum sitede görünmez ve puan ortalamasına katılmaz
// (firmanın puan özeti veritabanındaki tetikleyiciyle kendiliğinden güncellenir).
export async function PATCH(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!yoneticiMi(user?.email)) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });

  const { id, gizli } = await request.json().catch(() => ({}));
  if (!id || typeof gizli !== 'boolean') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

  const { data, error } = await servisIstemcisi().from('yorumlar').update({ gizli }).eq('id', id).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'Yorum bulunamadı (0 kayıt güncellendi).' }, { status: 404 });
  return NextResponse.json({ success: true });
}
