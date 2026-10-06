// Veritabanı aramalarında Türkçe İ/i sorunu: "ŞİFA" ilike "%şifa%" eşleşmiyor (veritabanı İ'yi i saymıyor).
// Bu yüzden arama metni, büyük/küçük harf duyarsız bir düzenli ifadeye (imatch) çevrilir; i, ı, I, İ birbirinin yerine geçer.
function trDesen(q: string): string {
  return q
    .trim()
    .replace(/[\\^$.|?*+()[\]{}]/g, "\\$&")
    .replace(/[iıIİ]/g, "[iİıI]");
}

// PostgREST .or(...) için: verilen sütunlardan herhangi birinde arama metni geçenler
export function aramaKosulu(q: string, sutunlar: string[]): string {
  const deger = `"${trDesen(q).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return sutunlar.map(s => `${s}.imatch.${deger}`).join(",");
}
