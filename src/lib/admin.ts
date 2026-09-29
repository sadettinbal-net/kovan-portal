// Yönetim paneline girebilen hesaplar. Veritabanındaki okuma kuralları (RLS) da aynı listeyi kullanır;
// burayı değiştirirsen supabase/migrations içindeki kuralları da güncelle.
export const ADMIN_EMAILS = ['sadettinbal@gmail.com'];

export function yoneticiMi(email: string | null | undefined) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
