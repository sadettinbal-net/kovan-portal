import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['sadettinbal@gmail.com', 'mustafabal93@gmail.com'];
const BUCKET = 'ilan-fotograflari';

export async function DELETE(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: ilan } = await supabase
    .from('ilanlar')
    .select('fotograflar')
    .eq('id', id)
    .single();

  if (ilan?.fotograflar && ilan.fotograflar.length > 0) {
    const storagePaths: string[] = ilan.fotograflar
      .map((url: string) => url.split(`/${BUCKET}/`)[1])
      .filter(Boolean);
    if (storagePaths.length > 0) {
      await supabase.storage.from(BUCKET).remove(storagePaths);
    }
  }

  const { error } = await supabase.from('ilanlar').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
