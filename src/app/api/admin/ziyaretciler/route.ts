import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_EMAILS } from '@/lib/admin';

// Yönetim Paneli → Ziyaretçiler: oturum listesi, bir oturumun sayfa/tıklama geçmişi ve silme
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function yetkiliMi() {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  return !!user && ADMIN_EMAILS.includes(user.email!);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAYFA_BOYU = 50;

// GET ?id=<oturum>  → o ziyaretin olayları
// GET ?sayfa=1&ara=<ip/şehir/ülke>  → ziyaret listesi (en yeni üstte)
export async function GET(request: NextRequest) {
  if (!(await yetkiliMi())) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  const supabase = getAdmin();
  const sp = new URL(request.url).searchParams;

  const id = sp.get('id');
  if (id) {
    if (!UUID.test(id)) return NextResponse.json({ error: 'Geçersiz.' }, { status: 400 });
    const { data, error } = await supabase
      .from('ziyaretci_olaylari')
      .select('id, tip, sayfa, hedef, baglanti, reklam_id, sure_ms, created_at')
      .eq('oturum_id', id)
      .order('created_at', { ascending: true })
      .limit(1000);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Firma sayfalarının (/firma/123) numaralarına karşılık gelen firma adları
    const idler = new Set<number>();
    for (const o of data || []) {
      for (const yol of [o.sayfa, o.baglanti]) {
        const m = yol?.match(/\/firma\/(\d+)/);
        if (m) idler.add(Number(m[1]));
      }
    }
    const firmaAdlari: Record<number, string> = {};
    if (idler.size) {
      const { data: firmalar } = await supabase.from('firmalar').select('id, ad').in('id', [...idler].slice(0, 500));
      for (const f of firmalar || []) firmaAdlari[f.id] = f.ad;
    }
    // Tıklanan / görülen reklamların başlığı ve yeri
    const reklamIdleri = [...new Set((data || []).map((o) => o.reklam_id).filter((x): x is number => !!x))];
    const reklamlar: Record<number, { baslik: string; konum: string; panel: number | null }> = {};
    if (reklamIdleri.length) {
      const { data: rk } = await supabase.from('reklamlar').select('id, baslik, konum, panel').in('id', reklamIdleri);
      for (const r of rk || []) reklamlar[r.id] = { baslik: r.baslik, konum: r.konum, panel: r.panel };
    }
    return NextResponse.json({ olaylar: data || [], firmaAdlari, reklamlar });
  }

  const sayfa = Math.max(parseInt(sp.get('sayfa') || '1') || 1, 1);
  const ara = (sp.get('ara') || '').replace(/[,()%*]/g, ' ').trim();
  let q = supabase
    .from('ziyaretci_oturumlari')
    .select('*', { count: 'exact' })
    .order('baslangic', { ascending: false })
    .range((sayfa - 1) * SAYFA_BOYU, sayfa * SAYFA_BOYU - 1);
  if (ara) {
    q = q.or(`ip.ilike.%${ara}%,sehir.ilike.%${ara}%,ulke.ilike.%${ara}%,bolge.ilike.%${ara}%,cihaz.ilike.%${ara}%`);
  }
  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ oturumlar: data || [], toplam: count || 0, sayfaBoyu: SAYFA_BOYU });
}

// DELETE { idler: [...] } → seçilen ziyaretleri siler; { tumu: true } → hepsini siler
// (Sayfa ve tıklama kayıtları da birlikte silinir.)
export async function DELETE(request: NextRequest) {
  if (!(await yetkiliMi())) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  const supabase = getAdmin();

  if (b?.tumu === true) {
    const { error } = await supabase.from('ziyaretci_oturumlari').delete().not('id', 'is', null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const idler: string[] = Array.isArray(b?.idler) ? b.idler.filter((x: unknown) => typeof x === 'string' && UUID.test(x)).slice(0, 500) : [];
  if (!idler.length) return NextResponse.json({ error: 'Silinecek kayıt seçilmedi.' }, { status: 400 });
  const { error } = await supabase.from('ziyaretci_oturumlari').delete().in('id', idler);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, silinen: idler.length });
}
