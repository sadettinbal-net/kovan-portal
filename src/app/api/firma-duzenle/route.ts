import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_EMAILS } from '@/lib/admin';

export async function PATCH(request: NextRequest) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 });

  const body = await request.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: firma } = await supabase
    .from('firmalar')
    .select('kullanici_email, ad')
    .eq('id', id)
    .single();

  if (!firma || firma.kullanici_email !== user.email) {
    return NextResponse.json({ error: 'Bu firmayı düzenleme yetkiniz yok.' }, { status: 403 });
  }

  const bekleyen = {
    ad: body.ad,
    sahip: body.sahip,
    sektor: body.sektor,
    sanayi_sitesi: body.sanayi_sitesi,
    telefon: body.telefon,
    mobil_telefon: body.mobil_telefon || null,
    adres: body.adres,
    hizmetler: body.hizmetler,
    aciklama: body.aciklama || null,
    web_sitesi: body.web_sitesi || null,
    instagram: body.instagram || null,
    facebook: body.facebook || null,
    twitter: body.twitter || null,
    youtube: body.youtube || null,
    linkedin: body.linkedin || null,
    tiktok: body.tiktok || null,
    eposta: body.eposta?.trim().toLowerCase() || null,
    nsosyal: body.nsosyal || null,
  };

  const { error } = await supabase.from('firmalar').update({
    bekleyen_degisiklikler: bekleyen,
    guncelleme_talep_tarihi: new Date().toISOString(),
  }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Admin'e bildirim maili
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ADMIN_EMAILS,
        subject: `✏️ Firma Güncelleme Talebi - Onaylayın: ${firma.ad}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:20px">
              <strong>✏️ Uyarı:</strong> Bir firma sahibi bilgilerini güncelledi, onaylamanız gerekiyor.
            </div>
            <h2 style="color:#1a3a6b">Firma Güncelleme Talebi</h2>
            <table style="border-collapse:collapse;width:100%;margin-top:16px">
              <tr style="background:#f5f7fa">
                <td style="padding:10px 14px;font-weight:bold;width:130px">Firma Adı</td>
                <td style="padding:10px 14px">${firma.ad}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;font-weight:bold">Sahip E-posta</td>
                <td style="padding:10px 14px">${user.email}</td>
              </tr>
              <tr style="background:#f5f7fa">
                <td style="padding:10px 14px;font-weight:bold">Talep Tarihi</td>
                <td style="padding:10px 14px">${new Date().toLocaleString('tr-TR')}</td>
              </tr>
            </table>
            <br>
            <a href="${siteUrl}/admin" style="background:#1a3a6b;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
              Admin Panelinde Onayla
            </a>
          </div>
        `,
      }),
    }).catch(e => console.error('Mail gönderilemedi:', e));
  }

  return NextResponse.json({ success: true });
}
