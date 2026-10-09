// Sunucu tarafı fotoğraf kontrolü: türü dosya adına veya gönderenin bildirdiği türe göre değil,
// dosyanın ilk baytlarındaki imzaya göre belirler. JPG, PNG ve WEBP kabul edilir; GIF sadece reklam görsellerinde (gif: true).

export const RESIM_EN_FAZLA_MB = 5;
export const RESIM_EN_FAZLA_BAYT = RESIM_EN_FAZLA_MB * 1024 * 1024;

export type ResimTuru = { mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'; uzanti: 'jpg' | 'png' | 'webp' | 'gif' };

export function resimTuruBul(b: Uint8Array, gif = false): ResimTuru | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', uzanti: 'jpg' };
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && png.every((x, i) => b[i] === x)) return { mime: 'image/png', uzanti: 'png' };
  const yazi = (bas: number, son: number) => String.fromCharCode(...b.slice(bas, son));
  if (b.length >= 12 && yazi(0, 4) === 'RIFF' && yazi(8, 12) === 'WEBP') return { mime: 'image/webp', uzanti: 'webp' };
  if (gif && b.length >= 6 && (yazi(0, 6) === 'GIF87a' || yazi(0, 6) === 'GIF89a')) return { mime: 'image/gif', uzanti: 'gif' };
  return null;
}

// Formdan gelen dosyaları kontrol eder; biri bile uymazsa hiçbirini kabul etmez.
export async function resimleriKontrolEt(
  dosyalar: File[],
  enFazlaAdet: number,
  secenek: { gif?: boolean } = {},
): Promise<{ resimler: { veri: Buffer; tur: ResimTuru }[] } | { hata: string }> {
  const gercek = dosyalar.filter((f) => f && typeof f === 'object' && f.size > 0);
  if (gercek.length > enFazlaAdet) return { hata: `En fazla ${enFazlaAdet} fotoğraf eklenebilir.` };
  const resimler: { veri: Buffer; tur: ResimTuru }[] = [];
  for (const f of gercek) {
    if (f.size > RESIM_EN_FAZLA_BAYT) return { hata: `"${f.name}" ${RESIM_EN_FAZLA_MB} MB'tan büyük.` };
    const veri = Buffer.from(await f.arrayBuffer());
    const tur = resimTuruBul(veri, secenek.gif);
    if (!tur) return { hata: `"${f.name}" geçerli bir resim değil. Sadece JPG, PNG${secenek.gif ? ', WEBP veya GIF' : ' veya WEBP'} yükleyebilirsiniz.` };
    resimler.push({ veri, tur });
  }
  return { resimler };
}

// Büyük fotoğraflar yüklenmeden önce küçültülür: en fazla 1200px genişlik, WebP (kalite 80).
// 300 KB altı ve 1200px'ten dar olanlara dokunulmaz; GIF'ler (hareketli olabilir) olduğu gibi kalır.
export const KUCULTME_SINIRI_BAYT = 300 * 1024;
export const KUCULTME_EN_FAZLA_GENISLIK = 1200;
export const WEBP_KALITE = 80;

export async function resmiKucult(resim: { veri: Buffer; tur: ResimTuru }): Promise<{ veri: Buffer; tur: ResimTuru }> {
  if (resim.tur.mime === 'image/gif') return resim;
  try {
    const sharp = (await import('sharp')).default;
    const { width = 0 } = await sharp(resim.veri).metadata();
    if (resim.veri.length <= KUCULTME_SINIRI_BAYT && width <= KUCULTME_EN_FAZLA_GENISLIK) return resim;
    const veri = await sharp(resim.veri)
      .rotate() // telefon fotoğraflarındaki yön bilgisini uygula
      .resize({ width: KUCULTME_EN_FAZLA_GENISLIK, withoutEnlargement: true })
      .webp({ quality: WEBP_KALITE })
      .toBuffer();
    // Nadiren WebP daha büyük çıkar (zaten sıkıştırılmış küçük resimler); o zaman aslını yükle
    if (veri.length >= resim.veri.length && width <= KUCULTME_EN_FAZLA_GENISLIK) return resim;
    return { veri, tur: { mime: 'image/webp', uzanti: 'webp' } };
  } catch (e) {
    console.error('Resim küçültülemedi, aslı yüklenecek:', e);
    return resim;
  }
}

// Kontrol edilmiş resmi (gerekirse küçültüp) içeriğinden anlaşılan tür ve uzantıyla depoya yükler; herkese açık adresini döndürür.
type Depo = { storage: { from(b: string): { upload(yol: string, veri: Buffer, s: { contentType: string; upsert: boolean }): PromiseLike<{ error: unknown }>; getPublicUrl(yol: string): { data: { publicUrl: string } } } } };
export async function resimYukle(supabase: Depo, depo: string, yolOneki: string, asil: { veri: Buffer; tur: ResimTuru }): Promise<string | null> {
  const resim = await resmiKucult(asil);
  const yol = `${yolOneki}.${resim.tur.uzanti}`;
  const { error } = await supabase.storage.from(depo).upload(yol, resim.veri, { contentType: resim.tur.mime, upsert: false });
  if (error) { console.error('Resim yüklenemedi:', yol, error); return null; }
  return supabase.storage.from(depo).getPublicUrl(yol).data.publicUrl;
}
