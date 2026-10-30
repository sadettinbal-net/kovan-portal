import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Her istekte canlı DB'den okunmalı; asla cache'lenmemeli.
// (Silinen/pasifleştirilen reklamın gösterilmeye devam etmesini önler.)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Yanıtı tarayıcı ve CDN'de cache'lenmeyecek şekilde döndürür.
function jsonNoStore(body: unknown) {
  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const KONUMLAR = ['video', 'sidebar', 'popup', 'anasayfa_ust', 'anasayfa_sol', 'anasayfa_sag', 'detay_sol', 'detay_sag', 'site_sol', 'site_sag', 'tip_sol', 'tip_sag'];

// Public: bir alandaki (konum) yayında olan özel reklamları döndürür.
// "Yayında" = aktif + (başlangıç tarihi geçmiş/boş) + (bitiş tarihi gelmemiş/boş)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const konum = searchParams.get('konum');
  const kategori = (searchParams.get('kategori') || '').trim();
  if (!konum || !KONUMLAR.includes(konum)) {
    return jsonNoStore({ reklamlar: [] });
  }

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('reklamlar')
    .select('id, baslik, gorsel_url, link_url, kategori, baslangic_tarihi, bitis_tarihi, yazi, yazi_konum, yazi_renk, yazi_boyut, yazi_yon, yazi_x, yazi_y, yazi_aci, yazi_yay, panel')
    .eq('konum', konum)
    .eq('aktif', true);

  if (error || !data) return jsonNoStore({ reklamlar: [] });

  const simdi = Date.now();
  const yayinda = data.filter((r) => {
    const bas = r.baslangic_tarihi ? new Date(r.baslangic_tarihi).getTime() : null;
    const bit = r.bitis_tarihi ? new Date(r.bitis_tarihi).getTime() : null;
    if (bas !== null && bas > simdi) return false;
    if (bit !== null && bit < simdi) return false;
    return true;
  });

  // Kategori hedefleme: o kategoriye özel reklam varsa onları kullan,
  // yoksa genel (kategorisiz) reklamlara düş.
  const kategoriyeOzel = kategori
    ? yayinda.filter((r) => (r.kategori || '') === kategori)
    : [];
  const genel = yayinda.filter((r) => !(r.kategori || '').trim());
  const secilenler = kategoriyeOzel.length > 0 ? kategoriyeOzel : genel;

  const sonuc = secilenler.map((r) => ({
    id: r.id,
    baslik: r.baslik,
    gorsel_url: r.gorsel_url,
    link_url: r.link_url,
    yazi: r.yazi,
    yazi_konum: r.yazi_konum,
    yazi_renk: r.yazi_renk,
    yazi_boyut: r.yazi_boyut,
    yazi_yon: r.yazi_yon,
    yazi_x: r.yazi_x,
    yazi_y: r.yazi_y,
    yazi_aci: r.yazi_aci,
    yazi_yay: r.yazi_yay,
    panel: r.panel,
  }));

  return jsonNoStore({ reklamlar: sonuc });
}
