import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Firma talebini reddet
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const adminSession = request.cookies.get('admin-session')?.value;
    if (!adminSession) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const { talep_id, yonetici_notu } = await request.json();

    if (!talep_id) {
      return NextResponse.json(
        { error: 'Talep ID gerekli' },
        { status: 400 }
      );
    }

    if (!yonetici_notu) {
      return NextResponse.json(
        { error: 'Reddetme nedeni gerekli' },
        { status: 400 }
      );
    }

    // Talebi al
    const { data: talep, error: talepError } = await supabase
      .from('firma_talepleri')
      .select('*')
      .eq('id', talep_id)
      .single();

    if (talepError || !talep) {
      return NextResponse.json(
        { error: 'Talep bulunamadı' },
        { status: 404 }
      );
    }

    if (talep.durum !== 'beklemede') {
      return NextResponse.json(
        { error: 'Bu talep zaten işleme alınmış' },
        { status: 400 }
      );
    }

    // Talebin durumunu güncelle
    const { error: guncelleError } = await supabase
      .from('firma_talepleri')
      .update({
        durum: 'reddedildi',
        yonetici_notu: yonetici_notu,
        onay_tarihi: new Date().toISOString(),
      })
      .eq('id', talep_id);

    if (guncelleError) {
      console.error('Talep güncelleme hatası:', guncelleError);
      return NextResponse.json(
        { error: 'Talep güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Talep reddedildi',
    });
  } catch (error) {
    console.error('Reddetme hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
