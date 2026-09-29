import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // OAuth code'u session'a çevir
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback hatası:', error);
      return NextResponse.redirect(new URL('/giris?error=auth_failed', request.url));
    }

    if (data.user) {
      // Kullanıcı bilgilerini uyeler tablosuna kaydet (eğer yoksa)
      const { error: dbError } = await supabase.from('uyeler').upsert(
        {
          id: data.user.id,
          email: data.user.email,
          ad: data.user.user_metadata?.full_name?.split(' ')[0] || data.user.user_metadata?.name || '',
          soyad: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          giris_yontemi: 'google',
          created_at: data.user.created_at,
        },
        { onConflict: 'id' }
      );

      if (dbError) {
        console.error('Kullanıcı kayıt hatası:', dbError);
      }

      // Başarılı giriş - ana sayfaya yönlendir
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Hata durumunda giriş sayfasına yönlendir
  return NextResponse.redirect(new URL('/giris', request.url));
}
