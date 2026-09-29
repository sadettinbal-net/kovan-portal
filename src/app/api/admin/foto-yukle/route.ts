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
  const firmaId = formData.get('firma_id') as string | null;
  const tip = formData.get('tip') as 'kart' | 'detay' | null;

  if (!file || !firmaId || !tip) {
    return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
  }

  const supabase = getAdmin();
  const uzanti = file.name.split('.').pop();
  const dosyaAdi = tip === 'kart'
    ? `firma-${firmaId}-${Date.now()}.${uzanti}`
    : `detay/${firmaId}-${Date.now()}.${uzanti}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(dosyaAdi, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: 'Yüklenemedi: ' + uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(dosyaAdi);
  const publicUrl = urlData.publicUrl;
  const id = parseInt(firmaId);

  if (tip === 'kart') {
    const { error } = await supabase.from('firmalar').update({ fotograf_url: publicUrl }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data: firma } = await supabase.from('firmalar').select('detay_fotograflar').eq('id', id).single();
    const mevcutlar: string[] = firma?.detay_fotograflar || [];
    const yeniDetaylar = [...mevcutlar, publicUrl];
    const { error } = await supabase.from('firmalar').update({ detay_fotograflar: yeniDetaylar }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}
