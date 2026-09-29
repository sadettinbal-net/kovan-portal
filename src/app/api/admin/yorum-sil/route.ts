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

export async function DELETE(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const { error } = await getAdmin().from('yorumlar').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
