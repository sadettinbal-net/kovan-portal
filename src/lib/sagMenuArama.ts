import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { aramaKosulu } from "@/lib/aramaDeseni";

// Sağ menüdeki Sanayi Dışı / Kurumsal sekmelerinin arama kutusu.
// Süzgeçler RightSidebarWrapper'daki sayımla aynı: sekmede sayılan firmalar aranır.
export async function sagMenuAramasi(request: Request, tip: "sitesiz" | "kurumsal") {
  const q = new URL(request.url).searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ sonuclar: [] });
  }

  let query = supabase
    .from("firmalar")
    .select("id, ad, sektor, il_adi, ilce_adi")
    .or(aramaKosulu(q, ["ad", "sektor"]))
    .not("ad", "ilike", "(Firma%")
    .eq("onay_durumu", "onaylandi");
  query =
    tip === "sitesiz"
      ? query.or("firma_tipi.eq.sitesiz,and(firma_tipi.is.null,or(sanayi_sitesi.is.null,sanayi_sitesi.eq.))")
      : query.eq("firma_tipi", "kurumsal");

  // Sonuç kutusu kendi içinde kaydırılır; yüksekliği sol menüdeki sanayi siteleri listesiyle aynı
  const { data: firmalar } = await query.limit(15);

  const sonuclar = (firmalar || []).map(f => ({
    id: f.id,
    baslik: f.ad,
    altBaslik: `${f.sektor || ""}${f.il_adi ? ` · ${f.il_adi}` : ""}`,
    url: `/firma/${f.id}`
  }));

  return NextResponse.json({ sonuclar });
}
