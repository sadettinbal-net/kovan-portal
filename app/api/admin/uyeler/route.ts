import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Tüm üyeleri listele (e-posta onay durumu ve son giriş ile)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-session')?.value;
    if (!token || token !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: uyeler, error } = await supabase
      .from('uyeler')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Onay durumu ve son giriş Supabase Auth'ta tutuluyor
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const hesaplar = new Map((authData?.users || []).map((u) => [u.id, u]));

    return NextResponse.json(
      (uyeler || []).map((uye) => ({
        ...uye,
        email_onayli: !!hesaplar.get(uye.id)?.email_confirmed_at,
        son_giris: hesaplar.get(uye.id)?.last_sign_in_at || null,
      }))
    );
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// DELETE - Üye sil
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-session')?.value;
    if (!token || token !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uyeId = searchParams.get('id');

    if (!uyeId) {
      return NextResponse.json({ error: 'Üye ID gerekli' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Önce auth kullanıcısını sil
    const { error: authError } = await supabase.auth.admin.deleteUser(uyeId);
    if (authError) {
      console.error('Auth silme hatası:', authError);
      // Auth hatası olsa bile devam et, çünkü uyeler tablosunu temizlemeliyiz
    }

    // Sonra uyeler tablosundan sil
    const { error: dbError } = await supabase
      .from('uyeler')
      .delete()
      .eq('id', uyeId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Üye silme hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
