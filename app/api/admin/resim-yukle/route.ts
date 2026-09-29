import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MAX_BOYUT = 5 * 1024 * 1024; // 5MB

// POST - Yönetici firma resmi yükler, herkese açık adresini döndürür
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-session')?.value;
    if (!token || token !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await request.formData();
    const dosya = form.get('dosya');

    if (!(dosya instanceof File)) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }
    if (!dosya.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Sadece resim dosyası yüklenebilir' }, { status: 400 });
    }
    if (dosya.size > MAX_BOYUT) {
      return NextResponse.json({ error: "Resim 5MB'den büyük olamaz" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const uzanti = dosya.name.split('.').pop()?.toLowerCase() || 'jpg';
    const yol = `admin/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${uzanti}`;

    const { error } = await supabase.storage
      .from('firma-resimleri')
      .upload(yol, dosya, { contentType: dosya.type });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const url = supabase.storage.from('firma-resimleri').getPublicUrl(yol).data.publicUrl;
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
