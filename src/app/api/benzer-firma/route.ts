import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

export type BenzerFirma = { id: number; ad: string; kategori: string | null; sanayi_sitesi: string | null };

// Firma eklerken aynı il ve ilçede adı benzeyen firmalar (onay bekleyenler dahil).
// Firma ekleme formu giriş istediği için bu da sadece giriş yapmış kullanıcıya açık.
export async function POST(request: NextRequest) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });

  const { ad, il, ilce } = await request.json().catch(() => ({}));
  if (typeof ad !== 'string' || !ad.trim() || typeof il !== 'string' || !il) {
    return NextResponse.json({ firmalar: [] });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data, error } = await supabase.rpc('benzer_firma_bul', {
    p_ad: ad.trim(), p_il: il, p_ilce: typeof ilce === 'string' && ilce ? ilce : null,
  });
  if (error) {
    console.error('benzer_firma_bul:', error);
    return NextResponse.json({ error: 'Benzer firma kontrolü yapılamadı.' }, { status: 500 });
  }

  const firmalar: BenzerFirma[] = (data ?? []).map((f: BenzerFirma) => ({
    id: f.id, ad: f.ad, kategori: f.kategori, sanayi_sitesi: f.sanayi_sitesi,
  }));
  return NextResponse.json({ firmalar });
}
