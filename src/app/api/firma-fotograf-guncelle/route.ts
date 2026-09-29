import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'firma-fotograflari';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function urlToPath(url: string): string {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return url.slice(idx + marker.length);
}

export async function PATCH(request: NextRequest) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 });

  const formData = await request.formData();
  const id = Number(formData.get('id'));
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const supabase = getAdmin();

  const { data: firma } = await supabase
    .from('firmalar')
    .select('kullanici_email, fotograf_url, detay_fotograflar')
    .eq('id', id)
    .single();

  if (!firma || firma.kullanici_email !== user.email) {
    return NextResponse.json({ error: 'Bu firmayı düzenleme yetkiniz yok.' }, { status: 403 });
  }

  const silKart = formData.get('sil_kart') === 'true';
  const silDetaylar = formData.getAll('sil_detaylar') as string[];
  const yeniKart = formData.get('yeni_kart') as File | null;
  const yeniDetaylar = formData.getAll('yeni_detaylar') as File[];

  const updates: Record<string, unknown> = {};
  const ts = Date.now();

  // Kart resmi sil
  if (silKart && firma.fotograf_url) {
    await supabase.storage.from(BUCKET).remove([urlToPath(firma.fotograf_url)]);
    updates.fotograf_url = null;
  }

  // Yeni kart resmi yükle
  if (yeniKart && yeniKart.size > 0) {
    if (firma.fotograf_url && !silKart) {
      await supabase.storage.from(BUCKET).remove([urlToPath(firma.fotograf_url)]);
    }
    const ext = yeniKart.name.split('.').pop();
    const path = `kart/${id}-${ts}.${ext}`;
    const buffer = Buffer.from(await yeniKart.arrayBuffer());
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: yeniKart.type, upsert: true });
    if (!error) {
      updates.fotograf_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
  }

  // Detay fotoğraf sil
  let mevcutDetaylar: string[] = Array.isArray(firma.detay_fotograflar) ? firma.detay_fotograflar : [];
  if (silDetaylar.length > 0) {
    await supabase.storage.from(BUCKET).remove(silDetaylar.map(urlToPath));
    mevcutDetaylar = mevcutDetaylar.filter(url => !silDetaylar.includes(url));
    updates.detay_fotograflar = mevcutDetaylar;
  }

  // Yeni detay fotoğraf yükle
  const gecerliYeniDetaylar = yeniDetaylar.filter(f => f.size > 0).slice(0, Math.max(0, 5 - mevcutDetaylar.length));
  if (gecerliYeniDetaylar.length > 0) {
    const urls: string[] = [];
    for (let i = 0; i < gecerliYeniDetaylar.length; i++) {
      const file = gecerliYeniDetaylar[i];
      const ext = file.name.split('.').pop();
      const path = `detay/${id}-${ts}-${i}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: true });
      if (!error) {
        urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }
    }
    if (urls.length > 0) {
      updates.detay_fotograflar = [...mevcutDetaylar, ...urls];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from('firmalar').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
