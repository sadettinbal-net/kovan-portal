import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { servisIstemcisi } from '@/lib/firmaSilme';
import { puanVerilebilirMi, puanYorumKontrol } from '@/lib/yorumlar';

// Üyenin kendi değerlendirmesi: ekle (POST), düzenle (PATCH), sil (DELETE).
// Bir üye bir firmaya tek değerlendirme yapabilir; kayıt (firma_id, kullanici_email) ile bulunur.

async function girisYapanEposta() {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user?.email ? { email: user.email, user } : null;
}

function firmaIdAl(deger: unknown): number | null {
  const id = typeof deger === 'number' ? deger : parseInt(String(deger ?? ''));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(request: NextRequest) {
  const giris = await girisYapanEposta();
  if (!giris) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const firmaId = firmaIdAl(body.firma_id);
  if (!firmaId) return NextResponse.json({ error: 'Firma gerekli.' }, { status: 400 });
  const kontrol = puanYorumKontrol(body.puan, body.yorum);
  if ('hata' in kontrol) return NextResponse.json({ error: kontrol.hata }, { status: 400 });

  const supabase = servisIstemcisi();
  const engel = await puanVerilebilirMi(supabase, firmaId, giris.email);
  if (engel) return NextResponse.json({ error: engel.hata }, { status: engel.status });

  const meta = giris.user.user_metadata;
  const kullanici_ad = meta?.full_name || meta?.name || giris.email.split('@')[0] || 'Anonim';

  const { error } = await supabase.from('yorumlar').insert({
    firma_id: firmaId,
    kullanici_email: giris.email,
    kullanici_ad,
    yorum: kontrol.yorum,
    puan: kontrol.puan,
  });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Bu firmayı zaten değerlendirdiniz.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const giris = await girisYapanEposta();
  if (!giris) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const firmaId = firmaIdAl(body.firma_id);
  if (!firmaId) return NextResponse.json({ error: 'Firma gerekli.' }, { status: 400 });
  const kontrol = puanYorumKontrol(body.puan, body.yorum);
  if ('hata' in kontrol) return NextResponse.json({ error: kontrol.hata }, { status: 400 });

  const supabase = servisIstemcisi();
  const engel = await puanVerilebilirMi(supabase, firmaId, giris.email);
  if (engel) return NextResponse.json({ error: engel.hata }, { status: engel.status });

  // Gizli işareti değişmez: yönetici gizlediyse düzenleme onu tekrar görünür yapmaz
  const { data, error } = await supabase
    .from('yorumlar')
    .update({ puan: kontrol.puan, yorum: kontrol.yorum, guncelleme_tarihi: new Date().toISOString() })
    .eq('firma_id', firmaId)
    .eq('kullanici_email', giris.email)
    .select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'Düzenlenecek değerlendirmeniz bulunamadı.' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const giris = await girisYapanEposta();
  if (!giris) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const firmaId = firmaIdAl(body.firma_id);
  if (!firmaId) return NextResponse.json({ error: 'Firma gerekli.' }, { status: 400 });

  const { data, error } = await servisIstemcisi()
    .from('yorumlar')
    .delete()
    .eq('firma_id', firmaId)
    .eq('kullanici_email', giris.email)
    .select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'Silinecek değerlendirmeniz bulunamadı.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
