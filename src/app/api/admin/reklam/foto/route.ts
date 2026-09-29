import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['sadettinbal@gmail.com', 'mustafabal93@gmail.com'];
const BUCKET = 'firma-fotograflari';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Dosya yok.' }, { status: 400 });

  const supabase = getAdmin();
  const uzanti = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const dosyaAdi = `reklam/${Date.now()}-${Math.round(Math.random() * 1e6)}.${uzanti}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(dosyaAdi, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: 'Yüklenemedi: ' + uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(dosyaAdi);
  return NextResponse.json({ url: urlData.publicUrl });
}
