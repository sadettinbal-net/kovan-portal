import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_EMAILS } from '@/lib/admin';
const BUCKET = 'firma-fotograflari';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function DELETE(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  }

  const { url, firma_id, tip } = await request.json();
  if (!url || !firma_id || !tip) {
    return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
  }

  const supabase = getAdmin();

  // Storage'dan sil
  const storagePath = tip === 'kart'
    ? url.split(`/${BUCKET}/`)[1]
    : url.split(`/${BUCKET}/`)[1];

  if (storagePath) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
  }

  // DB güncelle
  if (tip === 'kart') {
    const { error } = await supabase.from('firmalar').update({ fotograf_url: null }).eq('id', firma_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data: firma } = await supabase.from('firmalar').select('detay_fotograflar').eq('id', firma_id).single();
    const yeniDetaylar = (firma?.detay_fotograflar || []).filter((u: string) => u !== url);
    const { error } = await supabase.from('firmalar').update({ detay_fotograflar: yeniDetaylar }).eq('id', firma_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
