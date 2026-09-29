import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

import { ADMIN_EMAILS } from "@/lib/admin";

// Admin İlan Yönetimi sekmesi için TÜM ilanları döner.
//
// Not: RLS, anon key'e sadece onay_durumu='onaylandi' ilanları gösteriyor;
// bu yüzden yönetim listesi client-side anon key ile çekildiğinde bekleyen/
// reddedilen ilanlar görünmüyordu. Oturum admin doğrulandıktan sonra
// service-role client ile hepsini okuyoruz.
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

  const { data, error } = await supabase
    .from("ilanlar")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ilanlar: data ?? [] });
}
