import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_EMAILS } from '@/lib/admin';
import { sektordenKategoriBul } from '@/lib/firmaKategorileri';
import { whatsappKontrol } from '@/lib/whatsapp';

export async function PATCH(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });
  // Özel Firma (sponsorlu): açıksa başlangıç ve bitiş tarihi zorunlu, bitiş başlangıçtan sonra; kapatılınca tarihler silinir
  if ('ozel_firma' in updates || 'ozel_baslangic' in updates || 'ozel_bitis' in updates) {
    if (updates.ozel_firma) {
      const bas = Date.parse(updates.ozel_baslangic ?? '');
      const bit = Date.parse(updates.ozel_bitis ?? '');
      if (isNaN(bas) || isNaN(bit)) {
        return NextResponse.json({ error: 'Özel Firma için başlangıç ve bitiş tarihi seçin.' }, { status: 400 });
      }
      if (bit <= bas) return NextResponse.json({ error: 'Özel Firma bitiş tarihi başlangıçtan sonra olmalı.' }, { status: 400 });
      updates.ozel_baslangic = new Date(bas).toISOString();
      updates.ozel_bitis = new Date(bit).toISOString();
    } else {
      updates.ozel_firma = false;
      updates.ozel_baslangic = null;
      updates.ozel_bitis = null;
    }
  }
  if ('whatsapp' in updates) {
    const whatsapp = whatsappKontrol(updates.whatsapp);
    if (whatsapp.hata) return NextResponse.json({ error: whatsapp.hata }, { status: 400 });
    updates.whatsapp = whatsapp.deger;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Sektör veya firma tipi değiştiyse kategori bağlantısı da güncellenir (listede olmayan bir ad yazıldıysa bağlantı boşalır)
  if ('sektor' in updates || 'firma_tipi' in updates) {
    const { data: eski } = await supabase.from('firmalar').select('sektor, firma_tipi').eq('id', id).single();
    const sektor = (updates.sektor ?? eski?.sektor ?? '') as string;
    const kategori = sektor ? await sektordenKategoriBul(supabase, sektor, (updates.firma_tipi ?? eski?.firma_tipi) as string | null) : null;
    updates.kategori_id = kategori?.id ?? null;
    if (kategori) updates.sektor = kategori.ad;
  }

  const { error } = await supabase.from('firmalar').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  revalidatePath('/ozel-firmalar');
  revalidatePath(`/firma/${id}`);

  return NextResponse.json({ success: true });
}
