import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// E-posta + şifre ile giriş. Oturum çerezleri sunucuda yazılır (Google girişindeki gibi).
// Yeni hesap açma burada yok: kayıt Google ile yapılır.
export async function POST(request: NextRequest) {
  try {
    const { email, sifre } = await request.json();
    if (typeof email !== 'string' || !email.trim() || typeof sifre !== 'string' || !sifre) {
      return NextResponse.json({ error: 'E-posta ve şifre zorunludur.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: sifre });

    if (error || !data.user) {
      const mesaj = error?.message.includes('Email not confirmed')
        ? 'E-posta adresiniz henüz onaylanmadı.'
        : 'E-posta veya şifre hatalı.';
      return NextResponse.json({ error: mesaj }, { status: 401 });
    }

    // İlk girişte kullanıcı listesine ekle (Google girişindeki gibi; google_id = Supabase kullanıcı id'si)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: mevcut } = await supabaseAdmin.from('users').select('id').eq('google_id', data.user.id).maybeSingle();
    if (!mevcut) {
      const meta = data.user.user_metadata || {};
      await supabaseAdmin.from('users').insert({
        google_id: data.user.id,
        email: data.user.email,
        name: [meta.ad, meta.soyad].filter(Boolean).join(' ') || meta.full_name || meta.name || data.user.email || 'Kullanıcı',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Şifre ile giriş hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
