import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Firma talebi oluşturma
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Kullanıcı ID kontrolü
    if (!data.kullanici_id) {
      return NextResponse.json(
        { error: 'Kullanıcı bilgisi bulunamadı' },
        { status: 401 }
      );
    }

    // Zorunlu alanlar kontrolü
    if (!data.dukkan_adi) {
      return NextResponse.json(
        { error: 'Firma adı zorunludur' },
        { status: 400 }
      );
    }

    if (!data.alt_kategori_id) {
      return NextResponse.json(
        { error: 'Kategori seçimi zorunludur' },
        { status: 400 }
      );
    }

    if (!data.site_id && !data.mahalle_id) {
      return NextResponse.json(
        { error: 'Konum bilgisi zorunludur' },
        { status: 400 }
      );
    }

    // Firma talebini kaydet
    const { data: talep, error } = await supabase
      .from('firma_talepleri')
      .insert([
        {
          kullanici_id: data.kullanici_id,
          dukkan_adi: data.dukkan_adi,
          usta_adi: data.usta_adi || null,
          telefon: data.telefon || null,
          cep_telefonu: data.cep_telefonu || null,
          whatsapp: data.whatsapp || null,
          site_id: data.site_id || null,
          mahalle_id: data.mahalle_id || null,
          sokak_id: data.sokak_id || null,
          blok_no: data.blok_no || null,
          web_sitesi: data.web_sitesi || null,
          alt_kategori_id: parseInt(data.alt_kategori_id),
          durum: 'beklemede',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Talep kaydetme hatası:', error);
      return NextResponse.json(
        { error: 'Talep kaydedilirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, talep },
      { status: 201 }
    );
  } catch (error) {
    console.error('Firma talebi hatası:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Kullanıcının kendi taleplerini görüntüleme
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kullanici_id = searchParams.get('kullanici_id');

    if (!kullanici_id) {
      return NextResponse.json(
        { error: 'Kullanıcı bilgisi bulunamadı' },
        { status: 401 }
      );
    }

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
      .eq('kullanici_id', kullanici_id)
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
