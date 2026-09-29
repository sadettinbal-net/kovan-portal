import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('google_id', user.id)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: userData?.name || user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: userData?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture,
        created_at: userData?.created_at,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
