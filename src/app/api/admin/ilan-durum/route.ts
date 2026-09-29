import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

import { ADMIN_EMAILS } from "@/lib/admin";

export async function PATCH(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id, durum } = await request.json();
  if (!id || !["onaylandi", "reddedildi"].includes(durum)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabase
    .from("ilanlar")
    .update({ onay_durumu: durum })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
