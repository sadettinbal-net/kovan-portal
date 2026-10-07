import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';

// Kategori resmi olan ama ana sayfa resmi olmayan firmaların ana sayfa resmini güncelle
export async function POST(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!yoneticiMi(user?.email)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  }

  const supabase = servisIstemcisi();

  // Kategori resmi olan ama ana sayfa resmi olmayan firmaları bul
  const { data: firmalar, error: selectError } = await supabase
    .from('firmalar')
    .select('id, ad, fotograf_url, ana_sayfa_resim')
    .not('fotograf_url', 'is', null)
    .or('ana_sayfa_resim.is.null,ana_sayfa_resim.eq.');

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (!firmalar || firmalar.length === 0) {
    return NextResponse.json({ message: 'Güncellenecek firma yok.', count: 0 });
  }

  // Her firmayı güncelle
  const promises = firmalar.map(firma =>
    supabase
      .from('firmalar')
      .update({ ana_sayfa_resim: firma.fotograf_url })
      .eq('id', firma.id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    console.error('Güncelleme hataları:', errors);
    return NextResponse.json({
      message: `${firmalar.length - errors.length} firma güncellendi, ${errors.length} hatada sorun yaşandı.`,
      count: firmalar.length - errors.length,
      errors: errors.length,
    }, { status: 207 });
  }

  return NextResponse.json({
    message: `${firmalar.length} firma başarıyla güncellendi.`,
    count: firmalar.length,
    firmalar: firmalar.map(f => ({ id: f.id, ad: f.ad })),
  });
}
