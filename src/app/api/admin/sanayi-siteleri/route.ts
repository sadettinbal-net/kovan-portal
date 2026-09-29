import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_EMAILS } from '@/lib/admin';

// Yönetim paneli: sanayi siteleri listele / ekle / düzenle / sil.
// Firmalar siteyi adıyla (sanayi_sitesi) ve site_id ile tutar; ad, il veya ilçe değişince firmalar da güncellenir.

async function yoneticiMi() {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  return !!user && ADMIN_EMAILS.includes(user.email!);
}

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const buyuk = (s: string) => s.trim().toLocaleUpperCase('tr-TR');
const baslikYazimi = (s: string) =>
  s.trim().toLocaleLowerCase('tr-TR').replace(/(^|\s)(\S)/g, (_, b: string, h: string) => b + h.toLocaleUpperCase('tr-TR'));

function sayfalariYenile() {
  revalidatePath('/', 'layout');
}

// GET - Bütün sanayi siteleri, her birinin firma ve alt site sayısıyla
export async function GET() {
  if (!(await yoneticiMi())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const db = admin();

  const { data: siteler, error } = await db
    .from('sanayi_siteleri')
    .select('id, site_adi, il_adi, ilce_adi, adres, ust_site_id')
    .order('il_adi')
    .order('site_adi');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const firmaSayisi = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from('firmalar').select('sanayi_sitesi').not('sanayi_sitesi', 'is', null).range(from, from + 999);
    for (const f of data || []) firmaSayisi.set(f.sanayi_sitesi, (firmaSayisi.get(f.sanayi_sitesi) || 0) + 1);
    if (!data || data.length < 1000) break;
  }

  return NextResponse.json(
    (siteler || []).map((s) => ({
      ...s,
      firma_sayisi: firmaSayisi.get(s.site_adi) || 0,
      alt_site_sayisi: (siteler || []).filter((a) => a.ust_site_id === s.id).length,
    }))
  );
}

type Govde = { id?: number; site_adi?: string; il_adi?: string; ilce_adi?: string; adres?: string; ust_site_id?: number | null };

async function dogrula(db: ReturnType<typeof admin>, g: Govde, id?: number) {
  if (!g.site_adi?.trim() || !g.il_adi?.trim() || !g.ilce_adi?.trim()) return 'Ad, il ve ilçe zorunludur.';
  const { data: ayniAd } = await db.from('sanayi_siteleri').select('id').eq('site_adi', g.site_adi.trim());
  if ((ayniAd || []).some((s) => s.id !== id)) return 'Bu adla kayıtlı başka bir sanayi sitesi var.';
  if (g.ust_site_id) {
    if (g.ust_site_id === id) return 'Bir site kendi içinde olamaz.';
    const { data: ust } = await db.from('sanayi_siteleri').select('ust_site_id').eq('id', g.ust_site_id).maybeSingle();
    if (!ust) return 'Seçilen üst site bulunamadı.';
    if (ust.ust_site_id) return 'Üst site olarak başka bir sitenin içindeki site seçilemez.';
  }
  return null;
}

// POST - Yeni sanayi sitesi
export async function POST(request: NextRequest) {
  if (!(await yoneticiMi())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const g: Govde = await request.json();
  const db = admin();
  const hata = await dogrula(db, g);
  if (hata) return NextResponse.json({ error: hata }, { status: 400 });

  const { data, error } = await db
    .from('sanayi_siteleri')
    .insert({
      site_adi: g.site_adi!.trim(),
      il_adi: buyuk(g.il_adi!),
      ilce_adi: buyuk(g.ilce_adi!),
      adres: g.adres?.trim() || null,
      ust_site_id: g.ust_site_id || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  sayfalariYenile();
  return NextResponse.json(data);
}

// PATCH - Düzenle; ad/il/ilçe değişirse o sitedeki firmalar da güncellenir
export async function PATCH(request: NextRequest) {
  if (!(await yoneticiMi())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const g: Govde = await request.json();
  if (!g.id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });
  const db = admin();

  const { data: eski } = await db.from('sanayi_siteleri').select('site_adi').eq('id', g.id).maybeSingle();
  if (!eski) return NextResponse.json({ error: 'Sanayi sitesi bulunamadı.' }, { status: 404 });
  const hata = await dogrula(db, g, g.id);
  if (hata) return NextResponse.json({ error: hata }, { status: 400 });

  const { error } = await db
    .from('sanayi_siteleri')
    .update({
      site_adi: g.site_adi!.trim(),
      il_adi: buyuk(g.il_adi!),
      ilce_adi: buyuk(g.ilce_adi!),
      adres: g.adres?.trim() || null,
      ust_site_id: g.ust_site_id || null,
    })
    .eq('id', g.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bu sitedeki firmalar (adıyla ya da numarasıyla bağlı olanlar)
  const { error: firmaHata, count } = await db
    .from('firmalar')
    .update(
      { sanayi_sitesi: g.site_adi!.trim(), site_id: g.id, il_adi: baslikYazimi(g.il_adi!), ilce_adi: baslikYazimi(g.ilce_adi!) },
      { count: 'exact' }
    )
    .or(`site_id.eq.${g.id},sanayi_sitesi.eq."${eski.site_adi.replace(/"/g, '\\"')}"`);
  if (firmaHata) return NextResponse.json({ error: 'Site güncellendi ama firmalar güncellenemedi: ' + firmaHata.message }, { status: 500 });

  sayfalariYenile();
  return NextResponse.json({ success: true, guncellenen_firma: count || 0 });
}

// DELETE - Sil (içinde firma varsa silinmez; alt siteler bağımsız kalır)
export async function DELETE(request: NextRequest) {
  if (!(await yoneticiMi())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });
  const db = admin();

  const { data: site } = await db.from('sanayi_siteleri').select('site_adi').eq('id', id).maybeSingle();
  if (!site) return NextResponse.json({ error: 'Sanayi sitesi bulunamadı.' }, { status: 404 });

  const { count } = await db
    .from('firmalar')
    .select('id', { count: 'exact', head: true })
    .or(`site_id.eq.${id},sanayi_sitesi.eq."${site.site_adi.replace(/"/g, '\\"')}"`);
  if (count) {
    return NextResponse.json(
      { error: `Bu sitede ${count} firma kayıtlı. Önce firmaları başka bir siteye taşıyın.` },
      { status: 409 }
    );
  }

  const { error } = await db.from('sanayi_siteleri').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  sayfalariYenile();
  return NextResponse.json({ success: true });
}
