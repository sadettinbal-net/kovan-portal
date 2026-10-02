import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { servisIstemcisi } from '@/lib/firmaSilme';
import { ayniEposta, CEVAP_EN_AZ, CEVAP_EN_FAZLA } from '@/lib/yorumlar';

// Firma sahibi kendi firmasındaki bir yoruma yanıt yazar, düzenler veya (boş gönderirse) siler.
// Yönetici yanıtı gizlediyse (cevap_gizli) düzenleme/silme bu işareti değiştirmez.
export async function PUT(request: NextRequest) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });

  const { yorum_id, cevap } = await request.json().catch(() => ({}));
  if (!Number.isInteger(yorum_id)) return NextResponse.json({ error: 'Yorum gerekli.' }, { status: 400 });
  if (cevap != null && typeof cevap !== 'string') return NextResponse.json({ error: 'Geçersiz yanıt.' }, { status: 400 });
  const metin = (cevap ?? '').trim();
  if (metin && (metin.length < CEVAP_EN_AZ || metin.length > CEVAP_EN_FAZLA)) {
    return NextResponse.json({ error: `Yanıt ${CEVAP_EN_AZ}-${CEVAP_EN_FAZLA} karakter olmalı.` }, { status: 400 });
  }

  const supabase = servisIstemcisi();
  const { data: yorum } = await supabase.from('yorumlar').select('id, firma_id, cevap, cevap_tarihi').eq('id', yorum_id).maybeSingle();
  if (!yorum) return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
  const { data: firma } = await supabase.from('firmalar').select('kullanici_email, onay_durumu').eq('id', yorum.firma_id).maybeSingle();
  if (!firma || !ayniEposta(firma.kullanici_email, user.email)) {
    return NextResponse.json({ error: 'Sadece firma sahibi yanıt yazabilir.' }, { status: 403 });
  }
  if (firma.onay_durumu !== 'onaylandi') return NextResponse.json({ error: 'Firma yayında değil.' }, { status: 400 });

  const simdi = new Date().toISOString();
  const guncelleme = metin
    ? {
        cevap: metin,
        cevap_tarihi: yorum.cevap_tarihi ?? simdi,
        cevap_guncelleme_tarihi: yorum.cevap ? simdi : null,
      }
    : { cevap: null, cevap_tarihi: null, cevap_guncelleme_tarihi: null };

  const { data, error } = await supabase.from('yorumlar').update(guncelleme).eq('id', yorum_id).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'Yanıt kaydedilemedi (0 kayıt güncellendi).' }, { status: 500 });
  return NextResponse.json({ success: true, silindi: !metin });
}
