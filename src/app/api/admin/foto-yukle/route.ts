import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';
import { resimleriKontrolEt, resimYukle } from '@/lib/resimKontrol';

const BUCKET = 'firma-fotograflari';

// Yönetici: firmaya kart veya detay fotoğrafı yükler. Dosya içeriğinden kontrol edilir (JPG/PNG/WEBP, ≤5 MB).
export async function POST(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!yoneticiMi(user?.email)) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const id = parseInt((formData.get('firma_id') as string) || '');
  const tip = formData.get('tip');
  if (!file || !id || (tip !== 'kart' && tip !== 'detay')) {
    return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
  }

  const kontrol = await resimleriKontrolEt([file], 1);
  if ('hata' in kontrol) return NextResponse.json({ error: kontrol.hata }, { status: 400 });
  if (kontrol.resimler.length === 0) return NextResponse.json({ error: 'Dosya boş.' }, { status: 400 });

  const supabase = servisIstemcisi();
  const yolOneki = tip === 'kart' ? `kart/${id}-${Date.now()}` : `detay/${id}-${Date.now()}`;
  const publicUrl = await resimYukle(supabase, BUCKET, yolOneki, kontrol.resimler[0]);
  if (!publicUrl) return NextResponse.json({ error: 'Yüklenemedi.' }, { status: 500 });

  if (tip === 'kart') {
    const { data, error } = await supabase.from('firmalar').update({ fotograf_url: publicUrl }).eq('id', id).select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: 'Firma bulunamadı (0 kayıt).' }, { status: 404 });
  } else {
    const { data: firma } = await supabase.from('firmalar').select('detay_fotograflar').eq('id', id).single();
    const mevcutlar: string[] = firma?.detay_fotograflar || [];
    const { data, error } = await supabase.from('firmalar').update({ detay_fotograflar: [...mevcutlar, publicUrl] }).eq('id', id).select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: 'Firma bulunamadı (0 kayıt).' }, { status: 404 });
  }

  return NextResponse.json({ url: publicUrl });
}
