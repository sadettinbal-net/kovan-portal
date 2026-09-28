import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-session')?.value;

    if (!token || token !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Firma sayısı
    const { count: firmaCount } = await supabase
      .from('dukkanlar')
      .select('*', { count: 'exact', head: true });

    // İl sayısı
    const { count: ilCount } = await supabase
      .from('iller')
      .select('*', { count: 'exact', head: true });

    // İlçe sayısı
    const { count: ilceCount } = await supabase
      .from('ilceler')
      .select('*', { count: 'exact', head: true });

    // Mahalle sayısı
    const { count: mahalleCount } = await supabase
      .from('mahalleler_yeni')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      totalFirmalar: firmaCount || 0,
      totalIller: ilCount || 0,
      totalIlceler: ilceCount || 0,
      totalMahalleler: mahalleCount || 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'İstatistikler yüklenemedi' },
      { status: 500 }
    );
  }
}
