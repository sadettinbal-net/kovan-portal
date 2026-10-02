import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { firmaKaliciSil, servisIstemcisi, silmeBilgisi } from '@/lib/firmaSilme';

async function yonetici() {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  return yoneticiMi(user?.email);
}

// Silme penceresi için bağlı kayıt sayıları
export async function GET(request: NextRequest) {
  if (!(await yonetici())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const id = parseInt(request.nextUrl.searchParams.get('id') || '');
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const bilgi = await silmeBilgisi(servisIstemcisi(), id);
  if (!bilgi) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });
  return NextResponse.json(bilgi);
}

export async function DELETE(request: NextRequest) {
  if (!(await yonetici())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const { id, ad } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const sonuc = await firmaKaliciSil(servisIstemcisi(), id, ad);
  if ('hata' in sonuc) return NextResponse.json({ error: sonuc.hata }, { status: sonuc.status });

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, fotografHatasi: sonuc.fotografHatasi });
}
