import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function mailGonder(isim: string, soyisim: string, sabit_telefon: string, mobil_telefon: string, email: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const icerik = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a3a6b">Yeni Üye Başvurusu</h2>
      <table style="border-collapse:collapse;width:100%;margin-top:16px">
        <tr style="background:#f5f7fa">
          <td style="padding:10px 14px;font-weight:bold;width:140px">İsim</td>
          <td style="padding:10px 14px">${isim}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:bold">Soyisim</td>
          <td style="padding:10px 14px">${soyisim}</td>
        </tr>
        <tr style="background:#f5f7fa">
          <td style="padding:10px 14px;font-weight:bold">Sabit Telefon</td>
          <td style="padding:10px 14px">${sabit_telefon}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:bold">Mobil Telefon</td>
          <td style="padding:10px 14px">${mobil_telefon}</td>
        </tr>
        <tr style="background:#f5f7fa">
          <td style="padding:10px 14px;font-weight:bold">E-posta</td>
          <td style="padding:10px 14px">${email}</td>
        </tr>
      </table>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: 'sadettinbal@gmail.com',
      subject: `Yeni Üye Başvurusu: ${isim} ${soyisim}`,
      html: icerik,
    }),
  }).catch(e => console.error('Üye kayıt maili gönderilemedi:', e));
}

export async function POST(request: NextRequest) {
  try {
    const { isim, soyisim, sabit_telefon, mobil_telefon, email } = await request.json();

    if (!isim || !soyisim || !sabit_telefon || !mobil_telefon || !email) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    const supabase = getAdmin();
    const { error } = await supabase.from("uyeler").insert({
      isim,
      soyisim,
      sabit_telefon,
      mobil_telefon,
      email,
    });

    if (error) {
      console.error("Üye Supabase kayıt hatası:", error.message);
    }

    await mailGonder(isim, soyisim, sabit_telefon, mobil_telefon, email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
