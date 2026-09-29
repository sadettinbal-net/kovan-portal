import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Yönetici işlemleri güvenlik kurallarına takılmadan tam yetkiyle çalışır
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Firma talebini onayla ve firmalar tablosuna ekle
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const adminSession = request.cookies.get('admin-session')?.value;
    if (adminSession !== 'authenticated') {
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

    // Admin firma formundaki gibi kategori adını da yaz
    const { data: altKategori } = talep.alt_kategori_id
      ? await supabase.from('alt_kategoriler').select('alt_kategori_adi').eq('id', talep.alt_kategori_id).maybeSingle()
      : { data: null };

    // Firmayı dukkanlar tablosuna ekle
    const { data: yeniFirma, error: firmaError } = await supabase
      .from('dukkanlar')
      .insert([
        {
          kategori: altKategori?.alt_kategori_adi || null,
          dukkan_adi: talep.dukkan_adi,
          usta_adi: talep.usta_adi,
          telefon: talep.telefon,
          cep_telefonu: talep.cep_telefonu,
          whatsapp: talep.whatsapp,
          site_id: talep.site_id,
          mahalle_id: talep.mahalle_id,
          sokak_id: talep.sokak_id,
          blok_no: talep.blok_no,
          web_sitesi: talep.web_sitesi,
          hizmetler: talep.hizmetler,
          kart_resmi: talep.kart_resmi,
          fotograflar: talep.fotograflar || [],
          alt_kategori_id: talep.alt_kategori_id,
        },
      ])
      .select()
      .single();

    if (firmaError) {
      console.error('Firma ekleme hatası:', firmaError);
      return NextResponse.json(
        { error: 'Firma eklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Talebin durumunu güncelle
    const { error: guncelleError } = await supabase
      .from('firma_talepleri')
      .update({
        durum: 'onaylandi',
        yonetici_notu: yonetici_notu || null,
        onay_tarihi: new Date().toISOString(),
      })
      .eq('id', talep_id);

    if (guncelleError) {
      console.error('Talep güncelleme hatası:', guncelleError);
      // Firma eklendi ama talep güncellenemedi - kritik değil
    }

    return NextResponse.json({
      success: true,
      firma: yeniFirma,
      message: 'Firma başarıyla onaylandı ve sisteme eklendi',
    });
  } catch (error) {
    console.error('Onaylama hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
