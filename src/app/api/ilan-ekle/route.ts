import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";

import { servisIstemcisi } from "@/lib/firmaSilme";
import { htmlKacis } from "@/lib/htmlKacis";
import { ILAN_EN_FAZLA_FOTO, ILAN_GUNLUK_SINIR, ilanAlanlariKontrol } from "@/lib/ilanKurallari";
import { resimleriKontrolEt } from "@/lib/resimKontrol";

const BUCKET = "ilan-fotograflari";

// İlan verme: Google ile giriş zorunlu; e-posta ve ad oturumdan alınır (formdan gelen e-posta kullanılmaz).
// Bir üye son 24 saatte en fazla ILAN_GUNLUK_SINIR ilan verebilir. Fotoğraflar içeriğinden kontrol edilir.
export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "İlan vermek için Google ile giriş yapın." }, { status: 401 });
    const email = user.email.toLowerCase();
    const meta = user.user_metadata || {};
    const ilan_veren_ad = String(meta.full_name || meta.name || email.split("@")[0]).slice(0, 100);

    const formData = await request.formData();
    const alan = (k: string) => {
      const v = formData.get(k);
      return typeof v === "string" ? v : undefined;
    };
    const kontrol = ilanAlanlariKontrol(
      { baslik: alan("baslik"), aciklama: alan("aciklama"), fiyat: alan("fiyat"), kategori: alan("kategori"), telefon: alan("telefon") },
      true,
    );
    if ("hata" in kontrol) return NextResponse.json({ error: kontrol.hata }, { status: 400 });
    const { baslik, aciklama, fiyat, kategori, telefon } = kontrol.alanlar as Required<typeof kontrol.alanlar>;

    // Fotoğraflar ilan kaydedilmeden önce kontrol edilir; biri bile uymazsa ilan kaydedilmez
    const foto = await resimleriKontrolEt(formData.getAll("fotograflar") as File[], ILAN_EN_FAZLA_FOTO);
    if ("hata" in foto) return NextResponse.json({ error: foto.hata }, { status: 400 });

    const supabase = servisIstemcisi();

    // Günlük sınır: son 24 saatte verilen ilanlar (bekleyen/onaylı/reddedilen hepsi sayılır)
    const { count } = await supabase
      .from("ilanlar")
      .select("id", { count: "exact", head: true })
      .eq("ilan_veren_email", email)
      .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString());
    if ((count ?? 0) >= ILAN_GUNLUK_SINIR) {
      return NextResponse.json({ error: `Günde en fazla ${ILAN_GUNLUK_SINIR} ilan verebilirsiniz. Lütfen yarın tekrar deneyin.` }, { status: 429 });
    }

    const { data: ilan, error: insertError } = await supabase
      .from("ilanlar")
      .insert({ baslik, aciklama, fiyat, kategori, telefon, ilan_veren_ad, ilan_veren_email: email, fotograflar: [], onay_durumu: "beklemede" })
      .select("id")
      .single();
    if (insertError || !ilan) {
      console.error("İlan kayıt hatası:", insertError);
      return NextResponse.json({ error: "Kayıt sırasında hata oluştu." }, { status: 500 });
    }

    // Fotoğraflar, içeriğinden anlaşılan türle ve uygun uzantıyla kaydedilir
    if (foto.resimler.length > 0) {
      const ts = Date.now();
      const urls: string[] = [];
      for (let i = 0; i < foto.resimler.length; i++) {
        const { veri, tur } = foto.resimler[i];
        const yol = `ilan-${ilan.id}-${i}-${ts}.${tur.uzanti}`;
        const { error } = await supabase.storage.from(BUCKET).upload(yol, veri, { contentType: tur.mime, upsert: false });
        if (error) { console.error("İlan fotoğrafı yüklenemedi:", error); continue; }
        urls.push(supabase.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl);
      }
      if (urls.length > 0) await supabase.from("ilanlar").update({ fotograflar: urls }).eq("id", ilan.id);
    }

    // Yöneticiye bildirim (kullanıcıdan gelen her alan HTML'e kaçışlı yazılır)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const satir = (ad: string, deger: string, gri: boolean) =>
        `<tr${gri ? ' style="background:#f5f7fa"' : ""}><td style="padding:10px 14px;font-weight:bold;width:130px;vertical-align:top">${ad}</td><td style="padding:10px 14px;white-space:pre-wrap">${htmlKacis(deger)}</td></tr>`;
      const satirlar = [["Başlık", baslik], ["Kategori", kategori], ["İlan Veren", `${ilan_veren_ad} (${email})`], ["Telefon", telefon], ...(fiyat ? [["Fiyat", fiyat]] : []), ["Açıklama", aciklama]]
        .map(([ad, d], i) => satir(ad, d, i % 2 === 0)).join("");
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: "sadettinbal@gmail.com",
          subject: `⚠️ Yeni İlan Eklendi - Onaylayın: ${baslik.replace(/[\r\n]+/g, " ")}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:14px 18px;margin-bottom:20px">
                <strong>⚠️ Uyarı:</strong> Siteye yeni bir ilan eklendi, onaylayın.
              </div>
              <h2 style="color:#1a3a6b">Yeni İlan Başvurusu</h2>
              <table style="border-collapse:collapse;width:100%;margin-top:16px">${satirlar}</table>
              <br>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin" style="background:#1a3a6b;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
                Admin Panelinde Onayla
              </a>
            </div>
          `,
        }),
      }).catch((e) => console.error("İlan maili gönderilemedi:", e));
    }

    return NextResponse.json({ success: true, id: ilan.id });
  } catch (err) {
    console.error("API hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
