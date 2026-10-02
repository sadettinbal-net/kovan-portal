import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_EMAILS } from '@/lib/admin';
import { FIRMA_TIPI, sektordenKategoriBul, type KategoriTipi } from '@/lib/firmaKategorileri';

export async function PATCH(request: NextRequest) {
  // Sadece admin erişebilir
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { id, durum } = await request.json();
  if (!id || !['onaylandi', 'reddedildi', 'pasif'].includes(durum)) {
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

  // Onaylanan firma kategoriye bağlı değilse (üyenin önerdiği yeni kategori) sektör yazısıyla bağla.
  // Kategori henüz yoksa onaylanmaz; önce Kategori Yönetimi'nden eklenmeli.
  const guncelleme: Record<string, unknown> = { onay_durumu: durum };
  if (durum === 'onaylandi') {
    const { data: firma } = await supabase
      .from('firmalar').select('sektor, kategori_id, firma_tipi, yeni_kategori_tipi').eq('id', id).single();
    if (firma && !firma.kategori_id && firma.sektor) {
      const kategori = await sektordenKategoriBul(supabase, firma.sektor, firma.firma_tipi || firma.yeni_kategori_tipi);
      if (!kategori) {
        return NextResponse.json(
          { error: `"${firma.sektor}" kategorisi henüz yok. Önce Kategori Yönetimi'nden bu kategoriyi ekleyin, sonra firmayı onaylayın.` },
          { status: 409 }
        );
      }
      Object.assign(guncelleme, {
        kategori_id: kategori.id,
        sektor: kategori.ad,
        firma_tipi: FIRMA_TIPI[kategori.tip as KategoriTipi],
        yeni_kategori: false,
      });
    }
  }

  const { data: guncellenen, error } = await supabase
    .from('firmalar')
    .update(guncelleme)
    .eq('id', id)
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!guncellenen || guncellenen.length === 0) {
    return NextResponse.json({ error: 'Firma durumu değiştirilemedi (0 kayıt güncellendi).' }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
