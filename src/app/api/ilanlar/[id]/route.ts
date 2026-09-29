import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseInt((await params).id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Geçersiz ID." }, { status: 400 });
  }

  const supabase = getAdmin();
  const { data: ilan, error } = await supabase
    .from("ilanlar")
    .select("id, baslik, aciklama, kategori, fiyat, telefon, ilan_veren_ad, fotograflar, created_at")
    .eq("id", id)
    .eq("onay_durumu", "onaylandi")
    .single();

  if (error || !ilan) {
    return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ ilan });
}
