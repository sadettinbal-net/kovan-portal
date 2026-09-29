import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const tip = request.nextUrl.searchParams.get("tip") || "";
  const supabase = getAdmin();

  let query = supabase
    .from("ilanlar")
    .select("id, baslik, aciklama, kategori, fiyat, telefon, ilan_veren_ad, fotograflar, created_at")
    .eq("onay_durumu", "onaylandi")
    .order("created_at", { ascending: false });

  if (tip) {
    query = query.eq("kategori", tip);
  }

  const { data: ilanlar, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Kategori bazında sayılar
  const { data: tumOnaylı } = await supabase
    .from("ilanlar")
    .select("kategori")
    .eq("onay_durumu", "onaylandi");

  const kategoriBayi: Record<string, number> = {};
  (tumOnaylı || []).forEach((i) => {
    kategoriBayi[i.kategori] = (kategoriBayi[i.kategori] || 0) + 1;
  });

  return NextResponse.json({ ilanlar: ilanlar || [], kategoriBayi });
}
