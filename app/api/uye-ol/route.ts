import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - E-posta ile üye ol (e-posta onayı beklemeden hesap direkt onaylı açılır)
export async function POST(request: NextRequest) {
  try {
    const { ad, soyad, telefon, cep_telefonu, email, sifre } = await request.json();

    if (!ad?.trim() || !soyad?.trim() || !cep_telefonu?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Ad, soyad, cep telefonu ve e-posta zorunludur' }, { status: 400 });
    }
    if (typeof sifre !== 'string' || sifre.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: sifre,
      email_confirm: true,
      user_metadata: {
        ad: ad.trim(),
        soyad: soyad.trim(),
        telefon: telefon?.trim() || '',
        cep_telefonu: cep_telefonu.trim(),
      },
    });

    if (error) {
      if (error.code === 'email_exists' || /already/i.test(error.message)) {
        return NextResponse.json({ error: 'Bu e-posta adresiyle zaten üye olunmuş' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Üye olma hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
