import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SITE_EPOSTA_YONLENDIRME } from '@/lib/site';

// E-postaya yazılan kullanıcı metinlerini HTML'e karşı güvenli hale getir
function kacis(metin: string) {
  return metin.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export async function POST(request: NextRequest) {
  try {
    const { ad, telefon, email, mesaj } = await request.json();

    if (typeof ad !== 'string' || !ad.trim() || typeof mesaj !== 'string' || !mesaj.trim()) {
      return NextResponse.json({ error: 'Ad ve mesaj zorunludur.' }, { status: 400 });
    }
    if (ad.length > 200 || mesaj.length > 5000) {
      return NextResponse.json({ error: 'Mesaj çok uzun.' }, { status: 400 });
    }

    // 1. Mesajı kaydet (Yönetim panelinden okunur)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error } = await supabase.from('iletisim_mesajlari').insert({
      ad_soyad: ad.trim(),
      telefon: typeof telefon === 'string' ? telefon.trim().slice(0, 50) || null : null,
      eposta: typeof email === 'string' ? email.trim().slice(0, 200) || null : null,
      mesaj: mesaj.trim(),
    });
    if (error) {
      console.error('Mesaj kaydedilemedi:', error);
      return NextResponse.json({ error: 'Mesaj gönderilemedi.' }, { status: 500 });
    }

    // 2. E-posta servisi ayarlıysa bildirim de gönder
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const icerik = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1a3a6b">İletişim Formu Mesajı</h2>
          <table style="border-collapse:collapse;width:100%;margin-top:16px">
            <tr style="background:#f5f7fa">
              <td style="padding:10px 14px;font-weight:bold;width:120px">Ad Soyad</td>
              <td style="padding:10px 14px">${kacis(ad)}</td>
            </tr>
            ${telefon ? `<tr><td style="padding:10px 14px;font-weight:bold">Telefon</td><td style="padding:10px 14px">${kacis(String(telefon))}</td></tr>` : ''}
            ${email ? `<tr style="background:#f5f7fa"><td style="padding:10px 14px;font-weight:bold">E-Posta</td><td style="padding:10px 14px">${kacis(String(email))}</td></tr>` : ''}
            <tr>
              <td style="padding:10px 14px;font-weight:bold;vertical-align:top">Mesaj</td>
              <td style="padding:10px 14px;white-space:pre-wrap">${kacis(mesaj)}</td>
            </tr>
          </table>
        </div>
      `;

      for (const alici of [SITE_EPOSTA_YONLENDIRME]) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: alici,
            subject: `Kovan Portal - Yeni Mesaj: ${ad.trim().slice(0, 80)}`,
            html: icerik,
          }),
        }).catch((e) => console.error(`${alici} adresine mail gönderilemedi:`, e));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Mesaj gönderme hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
