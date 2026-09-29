import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/utils/supabase/server';

const ADMIN_EMAILS = ['sadettinbal@gmail.com', 'mustafabal93@gmail.com'];

export async function POST(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { firmaId } = await request.json();

  revalidatePath('/');
  revalidatePath('/firmalar');
  revalidatePath('/ozel-firmalar');
  if (firmaId) revalidatePath(`/firma/${firmaId}`);

  return NextResponse.json({ success: true });
}
