import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Public: bir özel reklamın tıklanma sayacını 1 artırır.
export async function POST(request: NextRequest) {
  let id: number | undefined;
  try {
    ({ id } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: 'id zorunlu.' }, { status: 400 });

  const supabase = adminClient();
  const { data } = await supabase.from('reklamlar').select('tiklanma').eq('id', id).single();
  const yeni = (data?.tiklanma || 0) + 1;
  await supabase.from('reklamlar').update({ tiklanma: yeni }).eq('id', id);

  return NextResponse.json({ success: true });
}
