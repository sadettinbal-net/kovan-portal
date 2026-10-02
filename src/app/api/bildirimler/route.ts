import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';
import { yeniYorumlar, type BildirimKapsami } from '@/lib/yorumlar';

// Panel içi yeni yorum bildirimi.
// ?kapsam=yonetici → tüm yorumlar (sadece yönetici) + bekleyen şikâyet sayısı
// ?kapsam=sahip    → giriş yapanın kendi firmalarının görünür yorumları
async function kontrol(kapsamHam: unknown) {
  const kapsam = kapsamHam === 'yonetici' || kapsamHam === 'sahip' ? (kapsamHam as BildirimKapsami) : null;
  if (!kapsam) return { hata: 'Geçersiz kapsam.', status: 400 } as const;
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user?.email) return { hata: 'Giriş yapmalısınız.', status: 401 } as const;
  if (kapsam === 'yonetici' && !yoneticiMi(user.email)) return { hata: 'Yetkisiz erişim.', status: 403 } as const;
  return { kapsam, email: user.email };
}

export async function GET(request: NextRequest) {
  const k = await kontrol(request.nextUrl.searchParams.get('kapsam'));
  if ('hata' in k) return NextResponse.json({ error: k.hata }, { status: k.status });

  const supabase = servisIstemcisi();
  const sonuc = await yeniYorumlar(supabase, k.kapsam, k.email);
  let bekleyenSikayet: number | undefined;
  let bekleyenIlan: number | undefined;
  if (k.kapsam === 'yonetici') {
    // ilanlar tablosu açık anahtarla okunamadığı için onay bekleyen ilan sayısı da buradan gelir
    const [s, i] = await Promise.all([
      supabase.from('yorum_sikayetleri').select('id', { count: 'exact', head: true }).eq('durum', 'bekliyor'),
      supabase.from('ilanlar').select('id', { count: 'exact', head: true }).eq('onay_durumu', 'beklemede'),
    ]);
    bekleyenSikayet = s.count ?? 0;
    bekleyenIlan = i.count ?? 0;
  }
  return NextResponse.json({ ...sonuc, bekleyenSikayet, bekleyenIlan });
}

// "Gördüm": sayaç sıfırlanır (bu andan sonraki yorumlar yeni sayılır)
export async function POST(request: NextRequest) {
  const { kapsam } = await request.json().catch(() => ({}));
  const k = await kontrol(kapsam);
  if ('hata' in k) return NextResponse.json({ error: k.hata }, { status: k.status });

  const { error } = await servisIstemcisi().from('yorum_bildirim_gorulme').upsert(
    { kullanici_email: k.email.toLowerCase(), kapsam: k.kapsam, son_gorulme: new Date().toISOString() },
    { onConflict: 'kullanici_email,kapsam' },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
