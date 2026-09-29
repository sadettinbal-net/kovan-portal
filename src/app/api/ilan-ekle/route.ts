import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "ilan-fotograflari";

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
  if (error) { console.error("Upload error:", error); return null; }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const baslik = (formData.get("baslik") as string)?.trim();
    const aciklama = (formData.get("aciklama") as string)?.trim();
    const fiyat = (formData.get("fiyat") as string)?.trim() || null;
    const kategori = (formData.get("kategori") as string)?.trim();
    const telefon = (formData.get("telefon") as string)?.trim();
    const ilan_veren_ad = (formData.get("ilan_veren_ad") as string)?.trim();
    const ilan_veren_email = (formData.get("ilan_veren_email") as string)?.trim() || null;
    const fotografFiles = formData.getAll("fotograflar") as File[];

    if (!baslik || !aciklama || !kategori || !telefon || !ilan_veren_ad) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
    }

    const supabase = getAdmin();

    // İlanı kaydet (fotoğraflar olmadan, ID almak için)
    const { data: ilan, error: insertError } = await supabase
      .from("ilanlar")
      .insert({
        baslik,
        aciklama,
        fiyat,
        kategori,
        telefon,
        ilan_veren_ad,
        ilan_veren_email,
        fotograflar: [],
        onay_durumu: "beklemede",
      })
      .select("id")
      .single();

    if (insertError || !ilan) {
      console.error("İlan kayıt hatası:", insertError);
      return NextResponse.json({ error: "Kayıt sırasında hata oluştu." }, { status: 500 });
    }

    // Fotoğrafları yükle (max 5)
    const gecerliFotolar = fotografFiles.filter((f) => f.size > 0).slice(0, 10);
    if (gecerliFotolar.length > 0) {
      const ts = Date.now();
      const fotografUrls: string[] = [];

      for (let i = 0; i < gecerliFotolar.length; i++) {
        const file = gecerliFotolar[i];
        const ext = file.name.split(".").pop() || "jpg";
        const url = await uploadFile(supabase, file, `ilan-${ilan.id}-${i}-${ts}.${ext}`);
        if (url) fotografUrls.push(url);
      }

      if (fotografUrls.length > 0) {
        await supabase
          .from("ilanlar")
          .update({ fotograflar: fotografUrls })
          .eq("id", ilan.id);
      }
    }

    // Mail bildirimi → sadettinbal@gmail.com
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'sadettinbal@gmail.com',
          subject: `⚠️ Yeni İlan Eklendi - Onaylayın: ${baslik}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:20px">
                <strong>⚠️ Uyarı:</strong> Siteye yeni bir ilan eklendi, onaylayın.
              </div>
              <h2 style="color:#1a3a6b">Yeni İlan Başvurusu</h2>
              <table style="border-collapse:collapse;width:100%;margin-top:16px">
                <tr style="background:#f5f7fa">
                  <td style="padding:10px 14px;font-weight:bold;width:130px">Başlık</td>
                  <td style="padding:10px 14px">${baslik}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;font-weight:bold">Kategori</td>
                  <td style="padding:10px 14px">${kategori}</td>
                </tr>
                <tr style="background:#f5f7fa">
                  <td style="padding:10px 14px;font-weight:bold">İlan Veren</td>
                  <td style="padding:10px 14px">${ilan_veren_ad}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;font-weight:bold">Telefon</td>
                  <td style="padding:10px 14px">${telefon}</td>
                </tr>
                ${fiyat ? `<tr style="background:#f5f7fa"><td style="padding:10px 14px;font-weight:bold">Fiyat</td><td style="padding:10px 14px">${fiyat}</td></tr>` : ''}
                <tr style="${fiyat ? '' : 'background:#f5f7fa'}">
                  <td style="padding:10px 14px;font-weight:bold;vertical-align:top">Açıklama</td>
                  <td style="padding:10px 14px;white-space:pre-wrap">${aciklama}</td>
                </tr>
              </table>
              <br>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin" style="background:#1a3a6b;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
                Admin Panelinde Onayla
              </a>
            </div>
          `,
        }),
      }).catch(e => console.error('İlan mail gönderilemedi:', e));
    }

    return NextResponse.json({ success: true, id: ilan.id });
  } catch (err) {
    console.error("API hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
