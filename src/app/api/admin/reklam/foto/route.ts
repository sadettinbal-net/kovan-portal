import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';
import { resimleriKontrolEt, resimYukle } from '@/lib/resimKontrol';

// Reklam görselleri ayrı depoda: GIF (hareketli banner), JPG, PNG, WEBP; en fazla 5 MB. Sadece yönetici yükler.
const BUCKET = 'reklam-gorselleri';

export async function POST(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!yoneticiMi(user?.email)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Dosya yok.' }, { status: 400 });

  const kontrol = await resimleriKontrolEt([file], 1, { gif: true });
  if ('hata' in kontrol) return NextResponse.json({ error: kontrol.hata }, { status: 400 });
  if (kontrol.resimler.length === 0) return NextResponse.json({ error: 'Dosya boş.' }, { status: 400 });

  const url = await resimYukle(servisIstemcisi(), BUCKET, `${Date.now()}-${Math.round(Math.random() * 1e6)}`, kontrol.resimler[0]);
  if (!url) return NextResponse.json({ error: 'Yüklenemedi.' }, { status: 500 });
  return NextResponse.json({ url });
}
