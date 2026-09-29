import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - İletişim formundan mesaj kaydet
export async function POST(request: NextRequest) {
  try {
    const { ad_soyad, telefon, eposta, mesaj } = await request.json();

    if (typeof ad_soyad !== 'string' || !ad_soyad.trim() || typeof mesaj !== 'string' || !mesaj.trim()) {
      return NextResponse.json({ error: 'Ad soyad ve mesaj zorunludur' }, { status: 400 });
    }
    if (ad_soyad.length > 200 || mesaj.length > 5000) {
      return NextResponse.json({ error: 'Mesaj çok uzun' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('iletisim_mesajlari').insert({
      ad_soyad: ad_soyad.trim(),
      telefon: typeof telefon === 'string' ? telefon.trim().slice(0, 50) || null : null,
      eposta: typeof eposta === 'string' ? eposta.trim().slice(0, 200) || null : null,
      mesaj: mesaj.trim(),
    });

    if (error) {
      console.error('İletişim mesajı kaydedilemedi:', error);
      return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
