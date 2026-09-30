import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ sonuclar: [] });
  }

  // Sanayi sitesi olmayan firmalarda ara
  const { data: firmalar } = await supabase
    .from("firmalar")
    .select("id, ad, sektor, il_adi, ilce_adi")
    .or("sanayi_sitesi.is.null,sanayi_sitesi.eq.")
    .or(`ad.ilike.%${q}%,sektor.ilike.%${q}%`)
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi")
    .limit(8);

  const sonuclar = (firmalar || []).map(f => ({
    id: f.id,
    baslik: f.ad,
    altBaslik: `${f.sektor || ""}${f.il_adi ? ` · ${f.il_adi}` : ""}`,
    url: `/firma/${f.id}`
  }));

  return NextResponse.json({ sonuclar });
}
