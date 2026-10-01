import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { yoneticiMi as yoneticiEpostasiMi } from '@/lib/admin';

// Yönetim paneli: firma kategorileri listele / ekle / düzenle / sil.
// firma_kategorileri tablosuna sadece burada, service role ile yazılır (tabloda yazma kuralı yok).
// Firmalar kategoriye kategori_id ile bağlı; eski sektor yazısı da yeni sayfalar tablodan okuyana kadar ad ile eşit tutulur.

const TIPLER = ['sanayi_sitesi', 'sanayi_disi', 'kurumsal'] as const;
type Tip = (typeof TIPLER)[number];

async function yoneticiMi() {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  return yoneticiEpostasiMi(user?.email);
}

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const yetkisiz = () => NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });

function sayfalariYenile() {
  revalidatePath('/', 'layout');
}

// Aynı adın tekrarına veritabanı izin vermez (tekil indeks); hatayı anlaşılır yaz.
function dbHatasi(error: { code?: string; message: string }) {
  if (error.code === '23505') {
    return NextResponse.json({ error: 'Bu tipte ve aynı ana kategori altında bu adla bir kategori zaten var.' }, { status: 409 });
  }
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// GET - Bütün kategoriler, her birinin firma ve alt kategori sayısıyla
export async function GET() {
  if (!(await yoneticiMi())) return yetkisiz();
  const db = admin();

  const { data: kategoriler, error } = await db
    .from('firma_kategorileri')
    .select('id, ad, tip, ust_kategori_id, sira, aktif')
    .order('tip')
    .order('sira')
    .order('ad');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const firmaSayisi = new Map<number, number>();
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from('firmalar').select('kategori_id').not('kategori_id', 'is', null).range(from, from + 999);
    for (const f of data || []) firmaSayisi.set(f.kategori_id, (firmaSayisi.get(f.kategori_id) || 0) + 1);
    if (!data || data.length < 1000) break;
  }

  return NextResponse.json(
    (kategoriler || []).map((k) => ({
      ...k,
      firma_sayisi: firmaSayisi.get(k.id) || 0,
      alt_kategori_sayisi: (kategoriler || []).filter((a) => a.ust_kategori_id === k.id).length,
    }))
  );
}

type Govde = { id?: number; ad?: string; tip?: Tip; ust_kategori_id?: number | null; sira?: number; aktif?: boolean };

// Ana kategori seçildiyse: var olmalı, kendisi ana kategori olmalı ve tipi aynı olmalı (en fazla 2 seviye).
async function ustKategoriyiDogrula(db: ReturnType<typeof admin>, ustId: number, tip: Tip, id?: number) {
  if (ustId === id) return 'Bir kategori kendi altına taşınamaz.';
  const { data: ust } = await db.from('firma_kategorileri').select('tip, ust_kategori_id').eq('id', ustId).maybeSingle();
  if (!ust) return 'Seçilen ana kategori bulunamadı.';
  if (ust.ust_kategori_id) return 'Ana kategori olarak bir alt kategori seçilemez.';
  if (ust.tip !== tip) return 'Alt kategori, ana kategorisiyle aynı tipte olmalı.';
  return null;
}

// POST - Yeni kategori (ust_kategori_id verilirse alt kategori)
export async function POST(request: NextRequest) {
  if (!(await yoneticiMi())) return yetkisiz();
  const g: Govde = await request.json();
  const ad = g.ad?.trim();
  if (!ad) return NextResponse.json({ error: 'Kategori adı boş olamaz.' }, { status: 400 });
  if (!g.tip || !TIPLER.includes(g.tip)) return NextResponse.json({ error: 'Geçersiz kategori tipi.' }, { status: 400 });
  const db = admin();

  if (g.ust_kategori_id) {
    const hata = await ustKategoriyiDogrula(db, g.ust_kategori_id, g.tip);
    if (hata) return NextResponse.json({ error: hata }, { status: 400 });
  }

  // Sıra verilmezse aynı gruptaki en sona eklenir
  let sira = g.sira;
  if (sira === undefined) {
    let q = db.from('firma_kategorileri').select('sira').eq('tip', g.tip).order('sira', { ascending: false }).limit(1);
    q = g.ust_kategori_id ? q.eq('ust_kategori_id', g.ust_kategori_id) : q.is('ust_kategori_id', null);
    const { data: son } = await q;
    sira = (son?.[0]?.sira ?? 0) + 1;
  }

  const { data, error } = await db
    .from('firma_kategorileri')
    .insert({ ad, tip: g.tip, ust_kategori_id: g.ust_kategori_id || null, sira, aktif: g.aktif ?? true })
    .select()
    .single();
  if (error) return dbHatasi(error);
  sayfalariYenile();
  return NextResponse.json(data);
}

// PATCH - Düzenle (ad, tip, ana kategori, sıra, aktif). Ad değişirse bu kategorideki firmaların sektor yazısı da güncellenir.
export async function PATCH(request: NextRequest) {
  if (!(await yoneticiMi())) return yetkisiz();
  const g: Govde = await request.json();
  if (!g.id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });
  const db = admin();

  const { data: eski } = await db.from('firma_kategorileri').select('*').eq('id', g.id).maybeSingle();
  if (!eski) return NextResponse.json({ error: 'Kategori bulunamadı.' }, { status: 404 });

  const ad = g.ad !== undefined ? g.ad.trim() : eski.ad;
  if (!ad) return NextResponse.json({ error: 'Kategori adı boş olamaz.' }, { status: 400 });
  const tip: Tip = g.tip ?? eski.tip;
  if (!TIPLER.includes(tip)) return NextResponse.json({ error: 'Geçersiz kategori tipi.' }, { status: 400 });
  const ustId = g.ust_kategori_id !== undefined ? g.ust_kategori_id || null : eski.ust_kategori_id;

  const [{ count: firmaSayisi }, { count: altSayisi }] = await Promise.all([
    db.from('firmalar').select('id', { count: 'exact', head: true }).eq('kategori_id', g.id),
    db.from('firma_kategorileri').select('id', { count: 'exact', head: true }).eq('ust_kategori_id', g.id),
  ]);

  if (tip !== eski.tip && (firmaSayisi || altSayisi)) {
    return NextResponse.json(
      { error: `Tipi değiştirilemez: bu kategoride ${firmaSayisi || 0} firma ve ${altSayisi || 0} alt kategori var.` },
      { status: 409 }
    );
  }
  if (ustId) {
    if (altSayisi) return NextResponse.json({ error: 'Alt kategorileri olan bir kategori başka bir kategorinin altına taşınamaz.' }, { status: 409 });
    const hata = await ustKategoriyiDogrula(db, ustId, tip, g.id);
    if (hata) return NextResponse.json({ error: hata }, { status: 400 });
  }

  const { error } = await db
    .from('firma_kategorileri')
    .update({ ad, tip, ust_kategori_id: ustId, sira: g.sira ?? eski.sira, aktif: g.aktif ?? eski.aktif })
    .eq('id', g.id);
  if (error) return dbHatasi(error);

  let guncellenenFirma = 0;
  if (ad !== eski.ad && firmaSayisi) {
    const { error: firmaHata, count } = await db
      .from('firmalar')
      .update({ sektor: ad }, { count: 'exact' })
      .eq('kategori_id', g.id);
    if (firmaHata) return NextResponse.json({ error: 'Kategori güncellendi ama firmaların sektör yazısı güncellenemedi: ' + firmaHata.message }, { status: 500 });
    guncellenenFirma = count || 0;
  }

  sayfalariYenile();
  return NextResponse.json({ success: true, guncellenen_firma: guncellenenFirma });
}

// DELETE - Sil (içinde firma veya alt kategori varsa silinmez)
export async function DELETE(request: NextRequest) {
  if (!(await yoneticiMi())) return yetkisiz();
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });
  const db = admin();

  const { data: kategori } = await db.from('firma_kategorileri').select('ad').eq('id', id).maybeSingle();
  if (!kategori) return NextResponse.json({ error: 'Kategori bulunamadı.' }, { status: 404 });

  const [{ count: firmaSayisi }, { count: altSayisi }] = await Promise.all([
    db.from('firmalar').select('id', { count: 'exact', head: true }).eq('kategori_id', id),
    db.from('firma_kategorileri').select('id', { count: 'exact', head: true }).eq('ust_kategori_id', id),
  ]);
  if (firmaSayisi || altSayisi) {
    const nedenler = [
      firmaSayisi ? `${firmaSayisi} firma` : '',
      altSayisi ? `${altSayisi} alt kategori` : '',
    ].filter(Boolean).join(' ve ');
    return NextResponse.json(
      { error: `"${kategori.ad}" silinemez: içinde ${nedenler} var. Önce bunları başka bir kategoriye taşıyın.` },
      { status: 409 }
    );
  }

  const { error } = await db.from('firma_kategorileri').delete().eq('id', id);
  if (error) return dbHatasi(error);
  sayfalariYenile();
  return NextResponse.json({ success: true });
}
