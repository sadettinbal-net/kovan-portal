import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Bir ilçenin mahallelerini listele (?ilce_id=)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-session')?.value;
    if (!token || token !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ilceId = request.nextUrl.searchParams.get('ilce_id');
    if (!ilceId) {
      return NextResponse.json({ error: 'ilce_id gerekli' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('mahalleler_yeni')
      .select('id, mahalle_id, mahalle_adi, created_at')
      .eq('ilce_id', parseInt(ilceId))
      .order('mahalle_adi');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// POST - Yeni mahalle ekle { ilce_id, mahalle_adi }
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-session')?.value;
    if (!token || token !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const ilceId = parseInt(body.ilce_id);
    let mahalleAdi = String(body.mahalle_adi || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');

    if (!ilceId || !mahalleAdi) {
      return NextResponse.json({ error: 'İlçe ve mahalle adı zorunludur' }, { status: 400 });
    }

    // Mevcut kayıtlar "CUMHURİYET MAHALLESİ" biçiminde
    if (!mahalleAdi.endsWith(' MAHALLESİ') && !mahalleAdi.endsWith(' KÖYÜ')) {
      mahalleAdi = mahalleAdi.replace(/ (MAH\.?|MAHALLE)$/, '') + ' MAHALLESİ';
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: ilce } = await supabase
      .from('ilceler')
      .select('id, sehir_id, ilce_adi')
      .eq('id', ilceId)
      .single();

    if (!ilce) {
      return NextResponse.json({ error: 'İlçe bulunamadı' }, { status: 404 });
    }

    const { data: il } = await supabase
      .from('iller')
      .select('sehir_adi')
      .eq('id', ilce.sehir_id)
      .single();

    // Aynı ilçede aynı isimde mahalle var mı?
    const { data: mevcut } = await supabase
      .from('mahalleler_yeni')
      .select('id')
      .eq('ilce_id', ilceId)
      .eq('mahalle_adi', mahalleAdi)
      .limit(1);

    if (mevcut && mevcut.length > 0) {
      return NextResponse.json({ error: `${mahalleAdi} bu ilçede zaten kayıtlı` }, { status: 409 });
    }

    // mahalle_id otomatik artmıyor; en büyük numaranın bir fazlasını veriyoruz
    const { data: enBuyuk } = await supabase
      .from('mahalleler_yeni')
      .select('mahalle_id')
      .order('mahalle_id', { ascending: false })
      .limit(1);

    const yeniMahalleId = (enBuyuk?.[0]?.mahalle_id || 0) + 1;

    const { data, error } = await supabase
      .from('mahalleler_yeni')
      .insert([
        {
          sehir_id: ilce.sehir_id,
          il_adi: il?.sehir_adi?.toLocaleUpperCase('tr-TR') || null,
          ilce_id: ilce.id,
          ilce_adi: ilce.ilce_adi?.toLocaleUpperCase('tr-TR') || null,
          mahalle_id: yeniMahalleId,
          mahalle_adi: mahalleAdi,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
