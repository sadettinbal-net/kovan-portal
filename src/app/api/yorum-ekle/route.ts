import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });

    const body = await request.json();
    const { firma_id, yorum, puan } = body;

    if (!firma_id || !puan) {
      return NextResponse.json({ error: 'Puan zorunludur.' }, { status: 400 });
    }
    if (puan < 1 || puan > 5) {
      return NextResponse.json({ error: 'Geçersiz puan.' }, { status: 400 });
    }
    if (yorum?.trim() && yorum.trim().length < 10) {
      return NextResponse.json({ error: 'Yorum yazacaksanız en az 10 karakter olmalı.' }, { status: 400 });
    }

    const kullanici_ad =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Anonim';

    const supabase = getAdmin();
    const { error } = await supabase.from('yorumlar').insert({
      firma_id,
      kullanici_email: user.email,
      kullanici_ad,
      yorum: yorum.trim(),
      puan,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Bu firmayı zaten değerlendirdiniz.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
