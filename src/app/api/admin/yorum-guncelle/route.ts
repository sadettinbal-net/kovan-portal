import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

const ADMIN_EMAILS = ['sadettinbal@gmail.com', 'mustafabal93@gmail.com'];

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function PATCH(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { id, puan, yorum } = await request.json();
  if (!id || !puan) return NextResponse.json({ error: 'ID ve puan gerekli.' }, { status: 400 });
  if (puan < 1 || puan > 5) return NextResponse.json({ error: 'Geçersiz puan.' }, { status: 400 });

  const { error } = await getAdmin()
    .from('yorumlar')
    .update({ puan, yorum: yorum ?? '' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
