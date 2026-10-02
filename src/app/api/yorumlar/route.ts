import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { servisIstemcisi } from '@/lib/firmaSilme';
import { YORUM_ALANLARI } from '@/lib/yorumlar';

// Firma sayfasındaki yorum bölümü: görünür yorumlar, veritabanındaki puan özeti,
// giriş yapan üyenin kendi değerlendirmesi (gizlenmiş olsa da) ve firma sahibi olup olmadığı.
export async function GET(request: NextRequest) {
  const firmaId = parseInt(request.nextUrl.searchParams.get('firmaId') || '');
  if (isNaN(firmaId)) return NextResponse.json({ error: 'Geçersiz firma ID' }, { status: 400 });

  const supabase = servisIstemcisi();
  const [{ data: firma }, { data: yorumlar, error }, { count: olumlu }] = await Promise.all([
    supabase.from('firmalar').select('onay_durumu, kullanici_email, yorum_sayisi, ortalama_puan, olumlu_yuzde').eq('id', firmaId).maybeSingle(),
    supabase.from('yorumlar').select(YORUM_ALANLARI).eq('firma_id', firmaId).eq('gizli', false).order('created_at', { ascending: false }),
    supabase.from('yorumlar').select('id', { count: 'exact', head: true }).eq('firma_id', firmaId).eq('gizli', false).gte('puan', 4),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!firma || firma.onay_durumu !== 'onaylandi') return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  let benim = null;
  if (user?.email) {
    const { data } = await supabase
      .from('yorumlar').select(`${YORUM_ALANLARI}, gizli`)
      .eq('firma_id', firmaId).eq('kullanici_email', user.email).maybeSingle();
    benim = data;
  }

  return NextResponse.json({
    yorumlar: yorumlar || [],
    stats: {
      toplam: firma.yorum_sayisi,
      olumlu: olumlu ?? 0,
      olumlu_yuzde: firma.olumlu_yuzde,
      ortalama_puan: firma.ortalama_puan,
    },
    benim,
    sahibi: !!user?.email && !!firma.kullanici_email && firma.kullanici_email.toLowerCase() === user.email.toLowerCase(),
  });
}
