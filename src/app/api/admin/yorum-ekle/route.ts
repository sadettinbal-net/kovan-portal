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

export async function POST(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { firma_id, kullanici_ad, puan, yorum } = await request.json();
  if (!firma_id || !puan || !kullanici_ad?.trim()) {
    return NextResponse.json({ error: 'Zorunlu alanlar eksik.' }, { status: 400 });
  }
  if (puan < 1 || puan > 5) {
    return NextResponse.json({ error: 'Geçersiz puan.' }, { status: 400 });
  }

  // Her admin yorumu için benzersiz e-posta oluştur (birden fazla ekleyebilsin)
  const adminEmail = `admin-${Date.now()}@admin.local`;

  const { error } = await getAdmin().from('yorumlar').insert({
    firma_id,
    kullanici_email: adminEmail,
    kullanici_ad: kullanici_ad.trim(),
    yorum: yorum?.trim() || '',
    puan,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
