import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Admin: Tüm talepleri listeleme
export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const adminSession = request.cookies.get('admin-session')?.value;
    if (!adminSession) {
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
        sanayi_siteleri (site_adi),
        mahalleler (mahalle_adi),
        sokaklar (sokak_adi)
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

    return NextResponse.json(talepler);
  } catch (error) {
    console.error('Talep listeleme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
