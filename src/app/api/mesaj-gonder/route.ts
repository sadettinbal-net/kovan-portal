import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ad, telefon, email, mesaj } = await request.json();

    if (!ad || !mesaj) {
      return NextResponse.json({ error: 'Ad ve mesaj zorunludur.' }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'Mail servisi yapılandırılmamış.' }, { status: 500 });
    }

    const icerik = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a3a6b">İletişim Formu Mesajı</h2>
        <table style="border-collapse:collapse;width:100%;margin-top:16px">
          <tr style="background:#f5f7fa">
            <td style="padding:10px 14px;font-weight:bold;width:120px">Ad Soyad</td>
            <td style="padding:10px 14px">${ad}</td>
          </tr>
          ${telefon ? `<tr><td style="padding:10px 14px;font-weight:bold">Telefon</td><td style="padding:10px 14px">${telefon}</td></tr>` : ''}
          ${email ? `<tr style="background:#f5f7fa"><td style="padding:10px 14px;font-weight:bold">E-Posta</td><td style="padding:10px 14px">${email}</td></tr>` : ''}
          <tr>
            <td style="padding:10px 14px;font-weight:bold;vertical-align:top">Mesaj</td>
            <td style="padding:10px 14px;white-space:pre-wrap">${mesaj}</td>
          </tr>
        </table>
      </div>
    `;

    // 1. Asıl mesaj → info@umraniyesanayisitesi.com
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'info@umraniyesanayisitesi.com',
        subject: `Yeni Mesaj: ${ad}`,
        html: icerik,
      }),
    }).catch(e => console.error('info maili gönderilemedi:', e));

    // 2. Uyarı bildirimi → sadettinbal@gmail.com
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'sadettinbal@gmail.com',
        subject: `⚠️ info@umraniyesanayisitesi.com'a Yeni Mesaj: ${ad}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:20px">
              <strong>⚠️ Uyarı:</strong> info@umraniyesanayisitesi.com adresine yeni bir mesaj geldi.
            </div>
            ${icerik}
          </div>
        `,
      }),
    }).catch(e => console.error('Admin bildirimi gönderilemedi:', e));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Mesaj gönderme hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
