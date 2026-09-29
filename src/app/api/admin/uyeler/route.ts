import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['sadettinbal@gmail.com', 'mustafabal93@gmail.com'];

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const supabase = adminClient();

  // Google ile giriş yapan kullanıcılar
  const { data: googleUsers } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, created_at')
    .order('created_at', { ascending: false });

  // Üye ol formuyla kayıt olanlar
  const { data: formUyeler } = await supabase
    .from('uyeler')
    .select('id, isim, soyisim, sabit_telefon, mobil_telefon, email, created_at')
    .order('created_at', { ascending: false });

  // Onaylı ilan verenler (ilanlar tablosundan, her emailden bir tane)
  const { data: ilanVerenler } = await supabase
    .from('ilanlar')
    .select('ilan_veren_ad, ilan_veren_email, telefon, created_at')
    .eq('onay_durumu', 'onaylandi')
    .not('ilan_veren_email', 'is', null)
    .order('created_at', { ascending: false });

  const googleEmails = new Set((googleUsers || []).map((u) => u.email));
  const formEmails = new Set((formUyeler || []).map((u) => u.email));

  const gorulmusEmailler = new Set([...Array.from(googleEmails), ...Array.from(formEmails)]);
  const teksilIlanVerenler = (ilanVerenler || []).filter((i) => {
    if (!i.ilan_veren_email || gorulmusEmailler.has(i.ilan_veren_email)) return false;
    gorulmusEmailler.add(i.ilan_veren_email);
    return true;
  });

  const uyeler = [
    ...(googleUsers || []).map((u) => ({
      id: `u_${u.id}`,
      ad: u.name,
      email: u.email,
      avatar_url: u.avatar_url,
      telefon: null as string | null,
      kaynak: 'google',
      created_at: u.created_at,
    })),
    ...(formUyeler || []).map((u) => ({
      id: `f_${u.id}`,
      ad: `${u.isim} ${u.soyisim}`,
      email: u.email,
      avatar_url: null as string | null,
      telefon: u.mobil_telefon || u.sabit_telefon,
      kaynak: 'form',
      created_at: u.created_at,
    })),
    ...teksilIlanVerenler.map((i) => ({
      id: `i_${i.ilan_veren_email}`,
      ad: i.ilan_veren_ad,
      email: i.ilan_veren_email!,
      avatar_url: null as string | null,
      telefon: i.telefon as string | null,
      kaynak: 'ilan',
      created_at: i.created_at,
    })),
  ];

  return NextResponse.json({ uyeler });
}

export async function DELETE(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const supabase = adminClient();
  const idStr = String(id);

  let error;
  if (idStr.startsWith('u_')) {
    const realId = idStr.slice(2);
    ({ error } = await supabase.from('users').delete().eq('id', realId));
  } else if (idStr.startsWith('f_')) {
    const realId = idStr.slice(2);
    ({ error } = await supabase.from('uyeler').delete().eq('id', realId));
  } else {
    return NextResponse.json({ error: 'İlan yoluyla kayıtlı üyeler silinemez. İlanı silin.' }, { status: 400 });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
