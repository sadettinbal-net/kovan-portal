// Kullanıcıdan gelen metni bildirim e-postasının HTML'ine güvenle yazmak için:
// < > & " ' karakterleri yazı olarak görünür, bağlantı/biçim olarak çalışmaz.
export function htmlKacis(deger: unknown): string {
  return String(deger ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
