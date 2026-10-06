import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { aramaKosulu } from "@/lib/aramaDeseni";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ sonuclar: [] });
  }

  // Sanayi sitelerinde ara
  const { data: siteler } = await supabase
    .from("sanayi_siteleri")
    .select("id, site_adi, il_adi, ilce_adi")
    .or(aramaKosulu(q, ["site_adi"]))
    .limit(5);

  // Sanayi sitelerindeki firmalarda ara
  const { data: firmalar } = await supabase
    .from("firmalar")
    .select("id, ad, sanayi_sitesi, sektor")
    .not("sanayi_sitesi", "is", null)
    .not("sanayi_sitesi", "eq", "")
    .or(aramaKosulu(q, ["ad", "sektor"]))
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi")
    .limit(5);

  const sonuclar = [
    ...(siteler || []).map(s => ({
      tip: "site" as const,
      id: s.id,
      baslik: s.site_adi,
      altBaslik: [s.ilce_adi, s.il_adi].filter(Boolean).join(" / "),
      url: `/firmalar?site=${encodeURIComponent(s.site_adi)}`
    })),
    ...(firmalar || []).map(f => ({
      tip: "firma" as const,
      id: f.id,
      baslik: f.ad,
      altBaslik: `${f.sanayi_sitesi || ""}${f.sektor ? ` · ${f.sektor}` : ""}`,
      url: `/firma/${f.id}`
    }))
  ];

  return NextResponse.json({ sonuclar });
}
