import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

import { ADMIN_EMAILS } from "@/lib/admin";

// Onay bekleyen firma ve ilanları admin paneline getirir.
//
// Not: Bu kayıtlar (onay_durumu = 'beklemede') RLS nedeniyle anon key ile
// okunamıyor; bu yüzden admin panelinin doğrudan client-side supabase ile
// çekmesi 0 sonuç dönüyordu. Burada oturum admin doğrulandıktan sonra
// service-role client ile okuyoruz.
export async function GET() {
  const supabaseUser = await createServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const [firmalar, ilanlar] = await Promise.all([
    supabase
      .from("firmalar")
      .select("*")
      .eq("onay_durumu", "beklemede")
      .order("created_at", { ascending: false }),
    supabase
      .from("ilanlar")
      .select("*")
      .eq("onay_durumu", "beklemede")
      .order("created_at", { ascending: false }),
  ]);

  if (firmalar.error) {
    return NextResponse.json({ error: firmalar.error.message }, { status: 500 });
  }
  if (ilanlar.error) {
    return NextResponse.json({ error: ilanlar.error.message }, { status: 500 });
  }

  return NextResponse.json({
    firmalar: firmalar.data ?? [],
    ilanlar: ilanlar.data ?? [],
  });
}
