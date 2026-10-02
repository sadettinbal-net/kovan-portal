import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { servisIstemcisi } from '@/lib/firmaSilme';
import { ayniEposta, YORUM_ALANLARI } from '@/lib/yorumlar';

const CEVAP_ALANLARI = 'cevap, cevap_tarihi, cevap_guncelleme_tarihi, cevap_gizli';

// Firma sayfasındaki yorum bölümü: görünür yorumlar, veritabanındaki puan özeti,
// giriş yapan üyenin kendi değerlendirmesi (gizlenmiş olsa da), firma sahibi olup olmadığı ve şikâyet ettiği yorumlar.
// Firma yanıtı: ziyaretçiye sadece gizli olmayan yanıt gider; firma sahibi kendi gizlenmiş yanıtını da görür.
export async function GET(request: NextRequest) {
  const firmaId = parseInt(request.nextUrl.searchParams.get('firmaId') || '');
  if (isNaN(firmaId)) return NextResponse.json({ error: 'Geçersiz firma ID' }, { status: 400 });

  const supabase = servisIstemcisi();
  const [{ data: firma }, { data: yorumlar, error }, { count: olumlu }] = await Promise.all([
    supabase.from('firmalar').select('onay_durumu, kullanici_email, yorum_sayisi, ortalama_puan, olumlu_yuzde').eq('id', firmaId).maybeSingle(),
    supabase.from('yorumlar').select(`${YORUM_ALANLARI}, ${CEVAP_ALANLARI}`).eq('firma_id', firmaId).eq('gizli', false).order('created_at', { ascending: false }),
    supabase.from('yorumlar').select('id', { count: 'exact', head: true }).eq('firma_id', firmaId).eq('gizli', false).gte('puan', 4),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!firma || firma.onay_durumu !== 'onaylandi') return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  const sahibi = ayniEposta(firma.kullanici_email, user?.email);
  let benim = null;
  let sikayetEttiklerim: number[] = [];
  if (user?.email) {
    const gorunurIdler = (yorumlar || []).map(y => y.id);
    if (gorunurIdler.length) {
      const { data: sik } = await supabase.from('yorum_sikayetleri').select('yorum_id')
        .eq('sikayet_eden_email', user.email.toLowerCase()).in('yorum_id', gorunurIdler);
      sikayetEttiklerim = (sik || []).map(s => s.yorum_id);
    }
    const { data } = await supabase
      .from('yorumlar').select(`${YORUM_ALANLARI}, gizli`)
      .eq('firma_id', firmaId).eq('kullanici_email', user.email).maybeSingle();
    benim = data;
  }

  return NextResponse.json({
    yorumlar: (yorumlar || []).map(({ cevap, cevap_tarihi, cevap_guncelleme_tarihi, cevap_gizli, ...y }) =>
      cevap && (!cevap_gizli || sahibi)
        ? { ...y, cevap, cevap_tarihi, cevap_guncelleme_tarihi, ...(sahibi ? { cevap_gizli } : {}) }
        : { ...y, cevap: null }),
    stats: {
      toplam: firma.yorum_sayisi,
      olumlu: olumlu ?? 0,
      olumlu_yuzde: firma.olumlu_yuzde,
      ortalama_puan: firma.ortalama_puan,
    },
    benim,
    sahibi,
    sikayetEttiklerim,
  });
}
