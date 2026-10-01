import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { yoneticiMi } from '@/lib/admin';
import { FIRMA_TIPI, KATEGORI_TIPI, sektordenKategoriBul, type FirmaTipi, type KategoriTipi } from '@/lib/firmaKategorileri';

const BUCKET = 'firma-fotograflari';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function uploadFile(
  supabase: ReturnType<typeof getAdmin>,
  file: File,
  path: string
): Promise<string | null> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (error) { console.error('Upload error:', error); return null; }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
    const formData = await request.formData();

    // Yönetici panelinden gelen kayıt onay beklemeden yayına girer
    const yonetici = formData.get('yonetici') === '1';
    if (yonetici && !yoneticiMi(authUser?.email)) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
    }
    // Yöneticinin eklediği firma yöneticinin profiline bağlanmasın
    const kullanici_email = yonetici ? null : authUser?.email ?? null;

    const ad           = (formData.get('ad') as string)?.trim();
    const sahip        = (formData.get('sahip') as string)?.trim() || null;
    const il_adi       = (formData.get('il_adi') as string)?.trim();
    const ilce_adi     = (formData.get('ilce_adi') as string)?.trim() || null;
    const siteIdRaw    = parseInt((formData.get('site_id') as string) || '');
    const mahalle_id   = parseInt((formData.get('mahalle_id') as string) || '') || null;
    const sokak_id     = parseInt((formData.get('sokak_id') as string) || '') || null;
    let sektor         = (formData.get('sektor') as string)?.trim() || '';
    const kategoriIdRaw = parseInt((formData.get('kategori_id') as string) || '');
    const firmaTipiRaw = formData.get('firma_tipi') as string;
    let firma_tipi: FirmaTipi | null = firmaTipiRaw && firmaTipiRaw in KATEGORI_TIPI ? (firmaTipiRaw as FirmaTipi) : null;
    const telefon      = (formData.get('telefon') as string)?.trim();
    const mobil_telefon = (formData.get('mobil_telefon') as string)?.trim() || null;
    const adres        = (formData.get('adres') as string)?.trim() || null;
    const plus_code    = (formData.get('plus_code') as string)?.trim() || null;
    const web_sitesi   =(formData.get('web_sitesi') as string)?.trim() || null;
    const eposta       = (formData.get('eposta') as string)?.trim().toLowerCase() || null;
    const instagram    = (formData.get('instagram') as string)?.trim() || null;
    const facebook     = (formData.get('facebook') as string)?.trim() || null;
    const tiktok       = (formData.get('tiktok') as string)?.trim() || null;
    const nsosyal      = (formData.get('nsosyal') as string)?.trim() || null;
    const hizmetlerRaw = (formData.get('hizmetler') as string) || '';
    const kartResmi    = formData.get('kart_resmi') as File | null;
    const detayFiles   = formData.getAll('detay_fotograflar') as File[];
    const yeniKategori = formData.get('yeni_kategori') === '1';
    const yeniKategoriTipi = (formData.get('yeni_kategori_tipi') as string) || null;

    if (!ad || !il_adi || (!sektor && isNaN(kategoriIdRaw)) || !telefon) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik.' }, { status: 400 });
    }

    const hizmetler = hizmetlerRaw
      .split(',').map(h => h.trim()).filter(Boolean);

    const supabase = getAdmin();

    // Kategori: listeden seçildiyse firma_kategorileri kaydından; sektör yazısı ve firma tipi oradan gelir.
    let kategori_id: number | null = null;
    if (!isNaN(kategoriIdRaw)) {
      const { data: kategori } = await supabase
        .from('firma_kategorileri').select('id, ad, tip').eq('id', kategoriIdRaw).eq('aktif', true).maybeSingle();
      if (!kategori) return NextResponse.json({ error: 'Seçilen kategori bulunamadı. Sayfayı yenileyip tekrar seçin.' }, { status: 400 });
      kategori_id = kategori.id;
      sektor = kategori.ad;
      firma_tipi = FIRMA_TIPI[kategori.tip as KategoriTipi];
    } else if (yonetici && firma_tipi) {
      // Yönetici yeni kategori yazdıysa: aynı adda kategori varsa ona bağlanır, yoksa ana kategori olarak eklenir
      const mevcut = await sektordenKategoriBul(supabase, sektor, firma_tipi);
      if (mevcut) {
        kategori_id = mevcut.id;
        sektor = mevcut.ad;
      } else {
        const { data: yeni, error: kategoriHata } = await supabase
          .from('firma_kategorileri').insert({ ad: sektor, tip: KATEGORI_TIPI[firma_tipi] }).select('id').single();
        if (kategoriHata || !yeni) return NextResponse.json({ error: 'Yeni kategori eklenemedi: ' + kategoriHata?.message }, { status: 500 });
        kategori_id = yeni.id;
      }
    }
    // Üye yeni kategori önerdiyse kategori_id boş kalır; yönetici onaylarken kategori eklenip bağlanır.

    // Sanayi sitesi adı formdan değil, seçilen sitenin kaydından alınır
    let site_id: number | null = null;
    let sanayi_sitesi: string | null = null;
    if (!isNaN(siteIdRaw)) {
      const { data: site } = await supabase.from('sanayi_siteleri').select('id, site_adi').eq('id', siteIdRaw).maybeSingle();
      if (site) {
        site_id = site.id;
        sanayi_sitesi = site.site_adi;
      }
    }

    // 1. Firmayı kaydet (fotoğraf URL'leri olmadan)
    const { data: firma, error: insertError } = await supabase
      .from('firmalar')
      .insert({
        ad, sahip, sanayi_sitesi, site_id, il_adi, ilce_adi, mahalle_id, sokak_id, sektor, kategori_id, firma_tipi,
        telefon, mobil_telefon, adres, plus_code, web_sitesi, eposta, instagram, facebook, tiktok, nsosyal,
        hizmetler, ozel_firma: false,
        fotograf_url: null, detay_fotograflar: [],
        onay_durumu: yonetici ? 'onaylandi' : 'beklemede',
        kullanici_email: kullanici_email,
        yeni_kategori: yeniKategori,
        yeni_kategori_tipi: yeniKategoriTipi,
      })
      .select('id')
      .single();

    if (insertError || !firma) {
      console.error('Insert error:', insertError);
      return NextResponse.json({
        error: 'Kayıt sırasında hata oluştu.',
        detail: insertError?.message ?? 'firma null döndü',
        code: insertError?.code,
      }, { status: 500 });
    }

    const id = firma.id;
    const ts = Date.now();
    const updates: Record<string, unknown> = {};

    // 2. Kart resmi yükle
    if (kartResmi && kartResmi.size > 0) {
      const ext = kartResmi.name.split('.').pop();
      const url = await uploadFile(supabase, kartResmi, `kart/${id}-${ts}.${ext}`);
      if (url) updates.fotograf_url = url;
    }

    // 3. Detay fotoğrafları yükle (max 5)
    const gecerliFotolar = detayFiles.filter(f => f.size > 0).slice(0, 5);
    if (gecerliFotolar.length > 0) {
      const urls: string[] = [];
      for (let i = 0; i < gecerliFotolar.length; i++) {
        const file = gecerliFotolar[i];
        const ext = file.name.split('.').pop();
        const url = await uploadFile(supabase, file, `detay/${id}-${i}-${ts}.${ext}`);
        if (url) urls.push(url);
      }
      if (urls.length > 0) updates.detay_fotograflar = urls;
    }

    // 4. URL'leri ve kullanici_email'i güncelle
    if (kullanici_email) updates.kullanici_email = kullanici_email;
    if (Object.keys(updates).length > 0) {
      await supabase.from('firmalar').update(updates).eq('id', id);
    }

    if (yonetici) {
      revalidatePath('/');
      revalidatePath('/firmalar');
      return NextResponse.json({ success: true, id });
    }

    // Mail gönder
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'sadettinbal@gmail.com',
          subject: `⚠️ Yeni Firma Eklendi - Onaylayın: ${ad}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:20px">
                <strong>⚠️ Uyarı:</strong> Siteye yeni bir firma eklendi, onaylayın.
              </div>
              <h2 style="color:#1a3a6b">Yeni Firma Başvurusu</h2>
              <table style="border-collapse:collapse;width:100%;margin-top:16px">
                <tr style="background:#f5f7fa">
                  <td style="padding:10px 14px;font-weight:bold;width:130px">Firma Adı</td>
                  <td style="padding:10px 14px">${ad}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;font-weight:bold">Konum</td>
                  <td style="padding:10px 14px">${[sanayi_sitesi, ilce_adi, il_adi].filter(Boolean).join(' / ')}</td>
                </tr>
                <tr style="background:#f5f7fa">
                  <td style="padding:10px 14px;font-weight:bold">Kategori</td>
                  <td style="padding:10px 14px">${sektor}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;font-weight:bold">Telefon</td>
                  <td style="padding:10px 14px">${telefon}</td>
                </tr>
                ${sahip ? `<tr style="background:#f5f7fa"><td style="padding:10px 14px;font-weight:bold">Yetkili</td><td style="padding:10px 14px">${sahip}</td></tr>` : ''}
              </table>
              <br>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin" style="background:#1a3a6b;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
                Admin Panelinde Onayla
              </a>
            </div>
          `,
        }),
      }).catch(e => console.error('Mail gönderilemedi:', e));
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({
      error: 'Sunucu hatası.',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
