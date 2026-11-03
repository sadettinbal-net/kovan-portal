import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { aramaKosulu } from "@/lib/aramaDeseni";
import { konumSuzgeci } from "@/lib/sagMenuArama";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ sonuclar: [] });
  }

  // Seçili il / ilçe (mahalle, sokak) varsa yalnızca oradaki siteler ve firmalar aranır.
  // sanayi_siteleri tablosunda il ve ilçe adları büyük harfle tutuluyor.
  const konum = konumSuzgeci(searchParams);
  const buyuk = (s: string) => s.toLocaleUpperCase("tr-TR");

  // Sanayi sitelerinde ara (mahalle/sokak seçiliyse sitelerin mahallesi bilinmediği için site önerisi yok)
  let siteSorgu = supabase
    .from("sanayi_siteleri")
    .select("id, site_adi, il_adi, ilce_adi")
    .or(aramaKosulu(q, ["site_adi"]));
  if (konum.il) siteSorgu = siteSorgu.eq("il_adi", buyuk(konum.il));
  if (konum.ilce) siteSorgu = siteSorgu.eq("ilce_adi", buyuk(konum.ilce));
  const { data: siteler } = konum.mahalle ? { data: [] } : await siteSorgu.limit(5);

  // Sanayi sitelerindeki firmalarda ara
  let firmaSorgu = supabase
    .from("firmalar")
    .select("id, ad, sanayi_sitesi, sektor")
    .not("sanayi_sitesi", "is", null)
    .not("sanayi_sitesi", "eq", "")
    .or(aramaKosulu(q, ["ad", "sektor"]))
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi");
  if (konum.il) firmaSorgu = firmaSorgu.eq("il_adi", konum.il);
  if (konum.ilce) firmaSorgu = firmaSorgu.eq("ilce_adi", konum.ilce);
  if (konum.mahalle) firmaSorgu = firmaSorgu.eq("mahalle_id", konum.mahalle);
  if (konum.sokak) firmaSorgu = firmaSorgu.eq("sokak_id", konum.sokak);
  const { data: firmalar } = await firmaSorgu.limit(5);

  const sonuclar = [
    ...(siteler || []).map(s => ({
      tip: "site" as const,
      id: s.id,
      baslik: s.site_adi,
      altBaslik: [s.ilce_adi, s.il_adi].filter(Boolean).join(" / "),
      url: `/firmalar?${konum.il ? `il=${encodeURIComponent(konum.il)}&` : ""}site=${encodeURIComponent(s.site_adi)}`
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
