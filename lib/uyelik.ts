import { supabase } from '@/lib/supabase';

// Google ile giriş: Google'a yönlendirir, dönüşte ana sayfaya gelir ve oturum açılır
export async function googleIleGiris() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    alert(
      error.message.includes('provider is not enabled')
        ? 'Google ile giriş henüz etkinleştirilmedi.'
        : 'Google ile giriş başarısız: ' + error.message
    );
  }
}

// Supabase hata mesajlarını Türkçeye çevir
export function uyelikHatasi(mesaj: string) {
  if (mesaj.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı';
  if (mesaj.includes('Email not confirmed')) return 'E-posta adresiniz henüz onaylanmadı. Gelen kutunuzdaki onay bağlantısına tıklayın.';
  if (mesaj.includes('User already registered')) return 'Bu e-posta adresiyle zaten üye olunmuş';
  if (mesaj.includes('Password should be at least')) return 'Şifre en az 6 karakter olmalı';
  if (mesaj.includes('Unable to validate email address') || mesaj.includes('invalid format')) return 'Geçerli bir e-posta adresi girin';
  if (mesaj.includes('rate limit')) return 'Çok fazla deneme yapıldı, lütfen biraz sonra tekrar deneyin';
  return mesaj;
}
