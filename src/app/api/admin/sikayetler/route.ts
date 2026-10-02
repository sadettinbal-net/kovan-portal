import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';
import { YORUM_ALANLARI } from '@/lib/yorumlar';

async function yonetici() {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  return yoneticiMi(user?.email);
}

// Bekleyen şikâyetler, yorum yorum gruplanmış (yorum, firma adı ve şikâyetçilerle)
export async function GET() {
  if (!(await yonetici())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const supabase = servisIstemcisi();

  const { data: sikayetler, error } = await supabase
    .from('yorum_sikayetleri')
    .select('id, yorum_id, sikayet_eden_email, sebep, aciklama, created_at')
    .eq('durum', 'bekliyor')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sikayetler?.length) return NextResponse.json({ yorumlar: [] });

  const yorumIdleri = [...new Set(sikayetler.map(s => s.yorum_id))];
  const { data: yorumlar } = await supabase
    .from('yorumlar').select(`${YORUM_ALANLARI}, firma_id, gizli, kullanici_email`).in('id', yorumIdleri);
  const firmaIdleri = [...new Set((yorumlar || []).map(y => y.firma_id))];
  const { data: firmalar } = await supabase.from('firmalar').select('id, ad').in('id', firmaIdleri);
  const firmaAdi = new Map((firmalar || []).map(f => [f.id, f.ad]));

  return NextResponse.json({
    yorumlar: (yorumlar || []).map(y => ({
      ...y,
      firma_ad: firmaAdi.get(y.firma_id) ?? '',
      sikayetler: sikayetler.filter(s => s.yorum_id === y.id),
    })).sort((a, b) => b.sikayetler.length - a.sikayetler.length),
  });
}

// Karar: 'gizle' → yorum gizlenir, bekleyen şikâyetler "gizlendi"; 'reddet' → yorum kalır, şikâyetler "reddedildi"
export async function PATCH(request: NextRequest) {
  if (!(await yonetici())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const { yorum_id, islem } = await request.json().catch(() => ({}));
  if (!yorum_id || !['gizle', 'reddet'].includes(islem)) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });

  const supabase = servisIstemcisi();
  if (islem === 'gizle') {
    const { data, error } = await supabase.from('yorumlar').update({ gizli: true }).eq('id', yorum_id).select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'Yorum bulunamadı (0 kayıt güncellendi).' }, { status: 404 });
  }

  const { data: kapanan, error } = await supabase
    .from('yorum_sikayetleri')
    .update({ durum: islem === 'gizle' ? 'gizlendi' : 'reddedildi', karar_tarihi: new Date().toISOString() })
    .eq('yorum_id', yorum_id)
    .eq('durum', 'bekliyor')
    .select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (islem === 'reddet' && (!kapanan || kapanan.length === 0)) {
    return NextResponse.json({ error: 'Bekleyen şikâyet bulunamadı (0 kayıt güncellendi).' }, { status: 404 });
  }
  return NextResponse.json({ success: true, kapananSikayet: kapanan?.length ?? 0 });
}
