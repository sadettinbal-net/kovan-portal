import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';

const BUCKET = 'ilan-fotograflari';

// Önce ilan silinir (silinen kayıt sayısı kontrol edilir), fotoğraflar ancak ondan sonra depodan silinir.
export async function DELETE(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!yoneticiMi(user?.email)) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });

  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const supabase = servisIstemcisi();
  const { data: silinen, error } = await supabase.from('ilanlar').delete().eq('id', id).select('id, fotograflar');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!silinen || silinen.length === 0) return NextResponse.json({ error: 'İlan silinemedi (0 kayıt silindi). Fotoğraflara dokunulmadı.' }, { status: 404 });

  const yollar = ((silinen[0].fotograflar || []) as string[])
    .map((url) => url.split(`/${BUCKET}/`)[1])
    .filter(Boolean);
  let fotografHatasi = false;
  if (yollar.length > 0) {
    const { error: depoHata } = await supabase.storage.from(BUCKET).remove(yollar);
    if (depoHata) { console.error('İlan silindi ama fotoğraflar silinemedi:', id, yollar, depoHata); fotografHatasi = true; }
  }
  return NextResponse.json({ success: true, fotografHatasi });
}
