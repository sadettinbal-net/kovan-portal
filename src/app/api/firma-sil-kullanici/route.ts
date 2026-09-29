import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function DELETE(request: NextRequest) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Firma ID gerekli.' }, { status: 400 });

  const supabase = adminClient();

  const { data: firma } = await supabase
    .from('firmalar')
    .select('id, kullanici_email, onay_durumu')
    .eq('id', id)
    .single();

  if (!firma) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });
  if (firma.kullanici_email && firma.kullanici_email !== user.email) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  if (firma.onay_durumu === 'onaylandi') return NextResponse.json({ error: 'Onaylı firma silinemez.' }, { status: 400 });

  const { error } = await supabase.from('firmalar').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
