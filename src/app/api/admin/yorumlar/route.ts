import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';
import { YORUM_ALANLARI } from '@/lib/yorumlar';

// Yönetici: bir firmanın tüm yorumları (gizliler dahil, yazanın e-postasıyla)
export async function GET(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!yoneticiMi(user?.email)) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });

  const firmaId = parseInt(request.nextUrl.searchParams.get('firmaId') || '');
  if (isNaN(firmaId)) return NextResponse.json({ error: 'Geçersiz firma ID' }, { status: 400 });

  const supabase = servisIstemcisi();
  const [{ data: yorumlar, error }, { data: firma }] = await Promise.all([
    supabase.from('yorumlar').select(`${YORUM_ALANLARI}, gizli, kullanici_email, cevap, cevap_tarihi, cevap_guncelleme_tarihi, cevap_gizli`).eq('firma_id', firmaId).order('created_at', { ascending: false }),
    supabase.from('firmalar').select('yorum_sayisi, ortalama_puan, olumlu_yuzde').eq('id', firmaId).maybeSingle(),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ yorumlar: yorumlar || [], ozet: firma });
}
