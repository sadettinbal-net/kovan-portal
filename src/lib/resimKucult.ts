// Tarayıcıda, göndermeden önce fotoğrafı küçültür: en uzun kenar 1600 piksel, JPEG %82 kalite.
// Telefonun yan çevirme bilgisi uygulanır; yeniden kaydetme sırasında fotoğraftaki konum (GPS) gibi
// gizli bilgiler de silinmiş olur. Okunamayan dosya olduğu gibi döner (sunucu yine kontrol eder).

export const EN_UZUN_KENAR = 1600;
export const JPEG_KALITE = 0.82;
// Yayındaki sunucu tek gönderimde ~4,5 MB'tan büyüğünü kabul etmiyor; güvenli sınır 4 MB
export const GONDERIM_SINIRI_MB = 4;

export async function resmiKucult(dosya: File): Promise<File> {
  let resim: ImageBitmap;
  try {
    resim = await createImageBitmap(dosya, { imageOrientation: 'from-image' });
  } catch {
    return dosya;
  }
  const oran = Math.min(1, EN_UZUN_KENAR / Math.max(resim.width, resim.height));
  const genislik = Math.max(1, Math.round(resim.width * oran));
  const yukseklik = Math.max(1, Math.round(resim.height * oran));

  const tuval = document.createElement('canvas');
  tuval.width = genislik;
  tuval.height = yukseklik;
  const ctx = tuval.getContext('2d');
  if (!ctx) { resim.close(); return dosya; }
  ctx.fillStyle = '#ffffff'; // saydam PNG'ler beyaz zeminle JPEG olur
  ctx.fillRect(0, 0, genislik, yukseklik);
  ctx.drawImage(resim, 0, 0, genislik, yukseklik);
  resim.close();

  const blob = await new Promise<Blob | null>((coz) => tuval.toBlob(coz, 'image/jpeg', JPEG_KALITE));
  if (!blob) return dosya;
  const ad = dosya.name.replace(/\.[^.]+$/, '') || 'foto';
  return new File([blob], `${ad}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

export const toplamMB = (dosyalar: (File | null | undefined)[]) =>
  dosyalar.reduce((t, f) => t + (f?.size ?? 0), 0) / (1024 * 1024);

export const gonderimSiniriUyarisi = (mb: number) =>
  `Fotoğrafların toplam boyutu küçültmeden sonra ${mb.toFixed(1)} MB; bir gönderimde en fazla ${GONDERIM_SINIRI_MB} MB gönderilebilir. ` +
  'Lütfen birkaç fotoğrafı çıkarın.';
