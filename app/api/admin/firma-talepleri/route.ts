import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Yönetici işlemleri güvenlik kurallarına takılmadan tam yetkiyle çalışır
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Admin: Tüm talepleri listeleme
export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const adminSession = request.cookies.get('admin-session')?.value;
    if (adminSession !== 'authenticated') {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const durum = searchParams.get('durum') || 'beklemede';

    const { data: talepler, error } = await supabase
      .from('firma_talepleri')
      .select(`
        *,
        alt_kategoriler (
          alt_kategori_adi,
          kategoriler (kategori_adi)
        ),
        sanayi_siteleri (site_adi)
      `)
      .eq('durum', durum)
      .order('olusturulma_tarihi', { ascending: false });

    if (error) {
      console.error('Talep listeleme hatası:', error);
      return NextResponse.json(
        { error: 'Talepler yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Mahalle ve sokak adları (mahalleler_yeni.mahalle_id / sokaklar.sokak_id numaralarıyla)
    const mahalleIdleri = [...new Set(talepler.map((t) => t.mahalle_id).filter(Boolean))];
    const sokakIdleri = [...new Set(talepler.map((t) => t.sokak_id).filter(Boolean))];
    const [{ data: mahalleler }, { data: sokaklar }] = await Promise.all([
      supabase.from('mahalleler_yeni').select('mahalle_id, mahalle_adi').in('mahalle_id', mahalleIdleri),
      supabase.from('sokaklar').select('sokak_id, sokak_adi').in('sokak_id', sokakIdleri),
    ]);
    const mahalleAdi = new Map((mahalleler || []).map((m) => [m.mahalle_id, m.mahalle_adi]));
    const sokakAdi = new Map((sokaklar || []).map((s) => [s.sokak_id, s.sokak_adi]));

    return NextResponse.json(
      talepler.map((t) => ({
        ...t,
        mahalleler: mahalleAdi.has(t.mahalle_id) ? { mahalle_adi: mahalleAdi.get(t.mahalle_id) } : null,
        sokaklar: sokakAdi.has(t.sokak_id) ? { sokak_adi: sokakAdi.get(t.sokak_id) } : null,
      }))
    );
  } catch (error) {
    console.error('Talep listeleme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
