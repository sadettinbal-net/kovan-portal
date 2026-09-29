import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_EMAILS } from '@/lib/admin';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function yetkiliMi() {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  return !!user && ADMIN_EMAILS.includes(user.email!);
}

const ALANLAR = ['baslik', 'gorsel_url', 'link_url', 'konum', 'kategori', 'aktif', 'baslangic_tarihi', 'bitis_tarihi', 'siralama'] as const;

export async function GET() {
  if (!(await yetkiliMi())) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('reklamlar')
    .select('*')
    .order('konum', { ascending: true })
    .order('siralama', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reklamlar: data || [] });
}

export async function POST(request: NextRequest) {
  if (!(await yetkiliMi())) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  const b = await request.json();
  if (!b.gorsel_url || !b.konum) {
    return NextResponse.json({ error: 'Görsel ve konum zorunlu.' }, { status: 400 });
  }
  const supabase = adminClient();
  const { data, error } = await supabase.from('reklamlar').insert({
    baslik: b.baslik || '',
    gorsel_url: b.gorsel_url,
    link_url: b.link_url || '',
    konum: b.konum,
    kategori: b.kategori || null,
    aktif: b.aktif ?? true,
    baslangic_tarihi: b.baslangic_tarihi || null,
    bitis_tarihi: b.bitis_tarihi || null,
    siralama: b.siralama ?? 0,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reklam: data });
}

export async function PUT(request: NextRequest) {
  if (!(await yetkiliMi())) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  const b = await request.json();
  if (!b.id) return NextResponse.json({ error: 'id zorunlu.' }, { status: 400 });
  const guncelle: Record<string, unknown> = {};
  for (const k of ALANLAR) {
    if (k in b) guncelle[k] = (k === 'baslangic_tarihi' || k === 'bitis_tarihi') ? (b[k] || null) : b[k];
  }
  const supabase = adminClient();
  const { error } = await supabase.from('reklamlar').update(guncelle).eq('id', b.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await yetkiliMi())) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id zorunlu.' }, { status: 400 });
  const supabase = adminClient();
  const { error } = await supabase.from('reklamlar').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
