import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

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
    const kullanici_email = authUser?.email ?? null;

    const formData = await request.formData();

    const ad           = (formData.get('ad') as string)?.trim();
    const sahip        = (formData.get('sahip') as string)?.trim() || null;
    const il_adi       = (formData.get('il_adi') as string)?.trim();
    const ilce_adi     = (formData.get('ilce_adi') as string)?.trim() || null;
    const siteIdRaw    = parseInt((formData.get('site_id') as string) || '');
    const mahalle_id   = parseInt((formData.get('mahalle_id') as string) || '') || null;
    const sokak_id     = parseInt((formData.get('sokak_id') as string) || '') || null;
    const sektor       = (formData.get('sektor') as string)?.trim();
    const telefon      = (formData.get('telefon') as string)?.trim();
    const mobil_telefon = (formData.get('mobil_telefon') as string)?.trim() || null;
    const adres        = (formData.get('adres') as string)?.trim() || null;
    const web_sitesi   = (formData.get('web_sitesi') as string)?.trim() || null;
    const hizmetlerRaw = (formData.get('hizmetler') as string) || '';
    const kartResmi    = formData.get('kart_resmi') as File | null;
    const detayFiles   = formData.getAll('detay_fotograflar') as File[];
    const yeniKategori = formData.get('yeni_kategori') === '1';
    const yeniKategoriTipi = (formData.get('yeni_kategori_tipi') as string) || null;

    if (!ad || !il_adi || !sektor || !telefon) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik.' }, { status: 400 });
    }

    const hizmetler = hizmetlerRaw
      .split(',').map(h => h.trim()).filter(Boolean);

    const supabase = getAdmin();

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
        ad, sahip, sanayi_sitesi, site_id, il_adi, ilce_adi, mahalle_id, sokak_id, sektor, telefon, mobil_telefon, adres, web_sitesi,
        hizmetler, ozel_firma: false,
        fotograf_url: null, detay_fotograflar: [],
        onay_durumu: 'beklemede',
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
