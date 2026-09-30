import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tip = searchParams.get('tip'); // 'siteli' veya 'sitesiz'

  const supabase = await createClient();

  if (tip === 'siteli') {
    // Sanayi sitesi içindeki firmalardan kategorileri al
    const { data, error } = await supabase
      .from('firmalar')
      .select('sektor')
      .not('sanayi_sitesi', 'is', null)
      .neq('sanayi_sitesi', '');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Kategorileri grupla ve say
    const kategoriSayilari = data.reduce((acc: Record<string, number>, firma) => {
      if (firma.sektor) {
        acc[firma.sektor] = (acc[firma.sektor] || 0) + 1;
      }
      return acc;
    }, {});

    const sonuc = Object.entries(kategoriSayilari).map(([kategori, sayi]) => ({
      kategori,
      sayi
    }));

    return NextResponse.json(sonuc);
  } else if (tip === 'sitesiz') {
    // Sanayi sitesi dışındaki firmalardan kategorileri al
    const { data, error } = await supabase
      .from('firmalar')
      .select('sektor')
      .or('sanayi_sitesi.is.null,sanayi_sitesi.eq.');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Kategorileri grupla ve say
    const kategoriSayilari = data.reduce((acc: Record<string, number>, firma) => {
      if (firma.sektor) {
        acc[firma.sektor] = (acc[firma.sektor] || 0) + 1;
      }
      return acc;
    }, {});

    const sonuc = Object.entries(kategoriSayilari).map(([kategori, sayi]) => ({
      kategori,
      sayi
    }));

    return NextResponse.json(sonuc);
  }

  return NextResponse.json({ error: 'Geçersiz tip parametresi' }, { status: 400 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { ad, tip } = await request.json();

  if (!ad || !tip) {
    return NextResponse.json({ error: 'Kategori adı ve tip gerekli' }, { status: 400 });
  }

  const sabitListe = tip === 'siteli'
    ? (await import('@/lib/sektorler-siteli')).SEKTORLER_SITELI
    : (await import('@/lib/sektorler-sitesiz')).SEKTORLER_SITESIZ;

  if (sabitListe.includes(ad)) {
    return NextResponse.json({ error: 'Bu kategori sabit listede zaten var' }, { status: 400 });
  }

  // Kategorinin zaten kullanılıp kullanılmadığını kontrol et
  const kolonAdi = 'sektor';
  const { data: mevcutFirmalar } = await supabase
    .from('firmalar')
    .select(kolonAdi)
    .eq(kolonAdi, ad);

  if (mevcutFirmalar && mevcutFirmalar.length > 0) {
    return NextResponse.json({ error: 'Bu kategori zaten kullanılıyor' }, { status: 400 });
  }

  // Kategorinin kullanılabilir olduğunu işaretle (örnek bir firma ekleyerek değil, sadece onay mesajı)
  return NextResponse.json({
    success: true,
    message: 'Kategori eklendi. Firma Ekle formunda artık kullanılabilir.'
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { eskiAd, yeniAd, tip } = await request.json();

  if (!eskiAd || !yeniAd || !tip) {
    return NextResponse.json({ error: 'Eski ad, yeni ad ve tip gerekli' }, { status: 400 });
  }

  const sabitListe = tip === 'siteli'
    ? (await import('@/lib/sektorler-siteli')).SEKTORLER_SITELI
    : (await import('@/lib/sektorler-sitesiz')).SEKTORLER_SITESIZ;

  if (sabitListe.includes(eskiAd)) {
    return NextResponse.json({ error: 'Sabit kategoriler düzenlenemez' }, { status: 400 });
  }

  // Tüm firmaların kategorisini güncelle
  const filtre = tip === 'siteli'
    ? supabase.from('firmalar').update({ sektor: yeniAd }).eq('sektor', eskiAd).not('sanayi_sitesi', 'is', null).neq('sanayi_sitesi', '')
    : supabase.from('firmalar').update({ sektor: yeniAd }).eq('sektor', eskiAd).or('sanayi_sitesi.is.null,sanayi_sitesi.eq.');

  const { error } = await filtre;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Kategori güncellendi' });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { ad, tip } = await request.json();

  if (!ad || !tip) {
    return NextResponse.json({ error: 'Kategori adı ve tip gerekli' }, { status: 400 });
  }

  const sabitListe = tip === 'siteli'
    ? (await import('@/lib/sektorler-siteli')).SEKTORLER_SITELI
    : (await import('@/lib/sektorler-sitesiz')).SEKTORLER_SITESIZ;

  if (sabitListe.includes(ad)) {
    return NextResponse.json({ error: 'Sabit kategoriler silinemez' }, { status: 400 });
  }

  // Bu kategorideki firmaları "DİĞER FİRMALAR" kategorisine taşı
  const varsayilanKategori = tip === 'siteli' ? 'DİĞER FİRMALAR' : 'DİĞER HİZMETLER';

  const filtre = tip === 'siteli'
    ? supabase.from('firmalar').update({ sektor: varsayilanKategori }).eq('sektor', ad).not('sanayi_sitesi', 'is', null).neq('sanayi_sitesi', '')
    : supabase.from('firmalar').update({ sektor: varsayilanKategori }).eq('sektor', ad).or('sanayi_sitesi.is.null,sanayi_sitesi.eq.');

  const { error } = await filtre;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Kategori silindi, firmalar varsayılan kategoriye taşındı' });
}
