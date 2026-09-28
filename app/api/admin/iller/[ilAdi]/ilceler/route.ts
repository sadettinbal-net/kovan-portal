import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Belirli ilin ilçelerini getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ilAdi: string }> }
) {
  try {
    const token = request.cookies.get('admin-session')?.value;
    if (!token || token !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // İl adından il ID'yi bul
    const { data: ilData } = await supabase
      .from('iller')
      .select('id')
      .eq('sehir_adi', decodeURIComponent((await params).ilAdi))
      .single();

    if (!ilData) {
      return NextResponse.json({ error: 'İl bulunamadı' }, { status: 404 });
    }

    // İlçeleri getir
    const { data, error } = await supabase
      .from('ilceler')
      .select('*')
      .eq('sehir_id', ilData.id)
      .order('ilce_adi');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
