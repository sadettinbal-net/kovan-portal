import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { firmaKaliciSil, servisIstemcisi, silmeBilgisi } from '@/lib/firmaSilme';

// Firma sahibi kendi firmasını kalıcı siler. Sahiplik kullanici_email ile kontrol edilir;
// sahibi olmayan (kullanici_email boş) firmalar buradan silinemez.
async function sahipKontrol(id: number) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user?.email) return { hata: 'Giriş yapmanız gerekiyor.', status: 401 };

  const supabase = servisIstemcisi();
  const { data: firma } = await supabase.from('firmalar').select('kullanici_email').eq('id', id).maybeSingle();
  if (!firma) return { hata: 'Firma bulunamadı.', status: 404 };
  if (!firma.kullanici_email || firma.kullanici_email.toLowerCase() !== user.email.toLowerCase()) {
    return { hata: 'Bu firma üzerinde işlem yetkiniz yok.', status: 403 };
  }
  return { supabase };
}

export async function GET(request: NextRequest) {
  const id = parseInt(request.nextUrl.searchParams.get('id') || '');
  if (!id) return NextResponse.json({ error: 'Firma ID gerekli.' }, { status: 400 });
  const kontrol = await sahipKontrol(id);
  if ('hata' in kontrol) return NextResponse.json({ error: kontrol.hata }, { status: kontrol.status });

  const bilgi = await silmeBilgisi(kontrol.supabase, id);
  if (!bilgi) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });
  return NextResponse.json(bilgi);
}

export async function DELETE(request: NextRequest) {
  const { id, ad } = await request.json();
  if (!id) return NextResponse.json({ error: 'Firma ID gerekli.' }, { status: 400 });
  const kontrol = await sahipKontrol(id);
  if ('hata' in kontrol) return NextResponse.json({ error: kontrol.hata }, { status: kontrol.status });

  const sonuc = await firmaKaliciSil(kontrol.supabase, id, ad);
  if ('hata' in sonuc) return NextResponse.json({ error: sonuc.hata }, { status: sonuc.status });

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, fotografHatasi: sonuc.fotografHatasi });
}

// Yayından kaldır / tekrar yayına gönder. Kaldırılan firma sitede görünmez;
// geri gönderilince onay bekler, yönetici onaylayınca tekrar yayına girer.
export async function PATCH(request: NextRequest) {
  const { id, islem } = await request.json();
  if (!id || !['kaldir', 'geri_gonder'].includes(islem)) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }
  const kontrol = await sahipKontrol(id);
  if ('hata' in kontrol) return NextResponse.json({ error: kontrol.hata }, { status: kontrol.status });

  const { data, error } = await kontrol.supabase
    .from('firmalar')
    .update({ onay_durumu: islem === 'kaldir' ? 'pasif' : 'beklemede' })
    .eq('id', id)
    .eq('onay_durumu', islem === 'kaldir' ? 'onaylandi' : 'pasif')
    .select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Firma durumu değiştirilemedi. Sayfayı yenileyip tekrar deneyin.' }, { status: 409 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, onay_durumu: islem === 'kaldir' ? 'pasif' : 'beklemede' });
}
