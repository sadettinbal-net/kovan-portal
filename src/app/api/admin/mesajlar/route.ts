import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';

// Yönetici: iletişim formundan gelen mesajlar (Reklam Ver'den gelenler konu='reklam').
async function yonetici() {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  return yoneticiMi(user?.email);
}

// ?konu=reklam | genel | tumu (varsayılan: reklam)
export async function GET(request: NextRequest) {
  if (!(await yonetici())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const konu = request.nextUrl.searchParams.get('konu') || 'reklam';

  const supabase = servisIstemcisi();
  let sorgu = supabase.from('iletisim_mesajlari')
    .select('id, ad_soyad, telefon, eposta, mesaj, okundu, konu, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (konu === 'reklam' || konu === 'genel') sorgu = sorgu.eq('konu', konu);
  const { data, error } = await sorgu;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const okunmamis = async (k: string) =>
    (await supabase.from('iletisim_mesajlari').select('id', { count: 'exact', head: true }).eq('konu', k).eq('okundu', false)).count ?? 0;
  const [reklam, genel] = await Promise.all([okunmamis('reklam'), okunmamis('genel')]);
  return NextResponse.json({ mesajlar: data || [], okunmamis: { reklam, genel } });
}

// Okundu / okunmadı işareti
export async function PATCH(request: NextRequest) {
  if (!(await yonetici())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const { id, okundu } = await request.json().catch(() => ({}));
  if (!id || typeof okundu !== 'boolean') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  const { data, error } = await servisIstemcisi().from('iletisim_mesajlari').update({ okundu }).eq('id', id).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: 'Mesaj bulunamadı (0 kayıt).' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await yonetici())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });
  const { data, error } = await servisIstemcisi().from('iletisim_mesajlari').delete().eq('id', id).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: 'Mesaj bulunamadı (0 kayıt).' }, { status: 404 });
  return NextResponse.json({ success: true });
}
