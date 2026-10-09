import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { aramaKosulu } from "@/lib/aramaDeseni";

// Sonuçlar parça parça gelir: kutu kaydırıldıkça bir sonraki parça istenir (sonsuz kaydırma)
const PARCA = 20;

// Sağ menüdeki Sanayi Dışı / Kurumsal sekmelerinin arama kutusu.
// Süzgeçler RightSidebarWrapper'daki sayımla aynı: sekmede sayılan firmalar aranır.
export async function sagMenuAramasi(request: Request, tip: "sitesiz" | "kurumsal") {
  const params = new URL(request.url).searchParams;
  const q = params.get("q") || "";
  const bas = Math.max(parseInt(params.get("bas") || "") || 0, 0);

  if (q.length < 2) {
    return NextResponse.json({ sonuclar: [], devamVar: false });
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

  // Sabit sıra şart: yoksa parçalar arasında aynı firma iki kez gelebilir ya da biri atlanabilir
  const { data: firmalar } = await query.order("ad").order("id").range(bas, bas + PARCA - 1);

  const sonuclar = (firmalar || []).map(f => ({
    id: f.id,
    baslik: f.ad,
    altBaslik: `${f.sektor || ""}${f.il_adi ? ` · ${f.il_adi}` : ""}`,
    url: `/firma/${f.id}`
  }));

  return NextResponse.json({ sonuclar, devamVar: sonuclar.length === PARCA });
}
