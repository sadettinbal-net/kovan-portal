import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['sadettinbal@gmail.com', 'mustafabal93@gmail.com'];
const BUCKET = 'firma-fotograflari';

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

  // Fotoğraf URL'lerini al
  const { data: firma } = await supabase
    .from('firmalar')
    .select('fotograf_url, detay_fotograflar')
    .eq('id', id)
    .single();

  // Storage'dan fotoğrafları sil
  if (firma) {
    const storagePaths: string[] = [];
    if (firma.fotograf_url) {
      const p = firma.fotograf_url.split('/firma-fotograflari/')[1];
      if (p) storagePaths.push(p);
    }
    (firma.detay_fotograflar || []).forEach((url: string) => {
      const p = url.split('/firma-fotograflari/')[1];
      if (p) storagePaths.push(p);
    });
    if (storagePaths.length > 0) {
      await supabase.storage.from(BUCKET).remove(storagePaths);
    }
  }

  const { error } = await supabase.from('firmalar').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
