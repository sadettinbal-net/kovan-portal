import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const firmaId = parseInt(request.nextUrl.searchParams.get('firmaId') || '');
  if (isNaN(firmaId)) return NextResponse.json({ error: 'Geçersiz firma ID' }, { status: 400 });

  const supabase = getAdmin();
  const { data: yorumlar, error } = await supabase
    .from('yorumlar')
    .select('id, kullanici_ad, yorum, puan, created_at')
    .eq('firma_id', firmaId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const toplam = yorumlar?.length || 0;
  const olumlu = yorumlar?.filter((y) => y.puan >= 4).length || 0;
  const olumlu_yuzde = toplam > 0 ? Math.round((olumlu / toplam) * 100) : null;
  const ortalama_puan =
    toplam > 0
      ? Math.round((yorumlar!.reduce((s, y) => s + y.puan, 0) / toplam) * 10) / 10
      : null;

  return NextResponse.json({
    yorumlar: yorumlar || [],
    stats: { toplam, olumlu, olumlu_yuzde, ortalama_puan },
  });
}
