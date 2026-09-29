'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { googleIleGiris, uyelikHatasi } from '@/lib/uyelik';
import { GoogleLogo } from '@/components/UyelikMenusu';

export default function UyeOlPage() {
  const [form, setForm] = useState({
    ad: '',
    soyad: '',
    telefon: '',
    cep_telefonu: '',
    email: '',
    sifre: '',
    sifreTekrar: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onayBekleniyor, setOnayBekleniyor] = useState(false);
  const router = useRouter();

  const alan = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.ad.trim() || !form.soyad.trim() || !form.cep_telefonu.trim() || !form.email.trim()) {
      setError('Ad, soyad, cep telefonu ve e-posta zorunludur');
      return;
    }
    if (form.sifre.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }
    if (form.sifre !== form.sifreTekrar) {
      setError('Şifreler birbiriyle aynı değil');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.sifre,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            ad: form.ad.trim(),
            soyad: form.soyad.trim(),
            telefon: form.telefon.trim(),
            cep_telefonu: form.cep_telefonu.trim(),
          },
        },
      });

      if (error) {
        setError(uyelikHatasi(error.message));
      } else if (data.user && data.user.identities?.length === 0) {
        // Supabase, kayıtlı e-postayı güvenlik için hata vermeden döndürür
        setError('Bu e-posta adresiyle zaten üye olunmuş');
      } else if (data.session) {
        // Session varsa direkt giriş yaptır
        router.push('/');
      } else {
        // Session yoksa (e-posta onayı bekliyorsa) mesaj göster
        setOnayBekleniyor(true);
      }
    } catch (err) {
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-100 px-4 py-10">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="text-center mb-6">
          <Link href="/" className="text-3xl font-black text-gray-800">
            Kovan Portal
          </Link>
          <p className="text-gray-600 mt-2">Üye Ol</p>
        </div>

        {onayBekleniyor ? (
          <div className="text-center space-y-4">
            <div className="text-6xl">✅</div>
            <p className="text-gray-800 font-bold">Üyeliğiniz Onaylandı!</p>
            <p className="text-gray-600 text-sm">
              <span className="font-semibold">{form.email}</span> adresine bir onay mesajı gönderdik.
              Artık giriş yaparak firmanızı ekleyebilirsiniz.
            </p>
            <Link href="/giris" className="inline-block bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-600 transition">
              Giriş Yap →
            </Link>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={googleIleGiris}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              <GoogleLogo />
              Google ile Üye Ol
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">veya e-posta ile</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ad" className="block text-sm font-medium text-gray-700 mb-1">
                    Ad <span className="text-red-500">*</span>
                  </label>
                  <input id="ad" type="text" autoComplete="given-name" {...alan('ad')} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="soyad" className="block text-sm font-medium text-gray-700 mb-1">
                    Soyad <span className="text-red-500">*</span>
                  </label>
                  <input id="soyad" type="text" autoComplete="family-name" {...alan('soyad')} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    id="telefon"
                    type="tel"
                    {...alan('telefon')}
                    className={inputClass}
                    placeholder="0322 123 45 67"
                  />
                </div>
                <div>
                  <label htmlFor="cep_telefonu" className="block text-sm font-medium text-gray-700 mb-1">
                    Cep Telefonu <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cep_telefonu"
                    type="tel"
                    autoComplete="tel"
                    {...alan('cep_telefonu')}
                    className={inputClass}
                    placeholder="0532 123 45 67"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input id="email" type="email" autoComplete="email" {...alan('email')} className={inputClass} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sifre" className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sifre"
                    type="password"
                    autoComplete="new-password"
                    {...alan('sifre')}
                    className={inputClass}
                    placeholder="En az 6 karakter"
                  />
                </div>
                <div>
                  <label htmlFor="sifreTekrar" className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre (Tekrar) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sifreTekrar"
                    type="password"
                    autoComplete="new-password"
                    {...alan('sifreTekrar')}
                    className={inputClass}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Kaydediliyor...' : 'Üye Ol'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Zaten üye misiniz?{' '}
              <Link href="/giris" className="text-yellow-700 font-bold hover:underline">
                Giriş yapın
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
