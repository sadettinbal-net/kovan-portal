// Kalıcı silme onayında yazılan ad ile firma adı karşılaştırılır (baş/son ve çift boşluklar önemsiz).
// Hem silme penceresi (tarayıcı) hem sunucu aynı kuralı kullanır.
export function adEslesiyor(yazilan: unknown, firmaAdi: string): boolean {
  const duzelt = (s: string) => s.trim().replace(/\s+/g, ' ');
  return typeof yazilan === 'string' && duzelt(yazilan) === duzelt(firmaAdi);
}
