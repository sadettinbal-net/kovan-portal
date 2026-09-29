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
      // Hesap sunucuda e-posta onayı beklemeden açılır
      const response = await fetch('/api/uye-ol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad: form.ad,
          soyad: form.soyad,
          telefon: form.telefon,
          cep_telefonu: form.cep_telefonu,
          email: form.email,
          sifre: form.sifre,
        }),
      });
      const sonuc = await response.json();

      if (!response.ok) {
        setError(uyelikHatasi(sonuc.error || 'Bir hata oluştu'));
        return;
      }

      // Direkt giriş yaptır
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.sifre,
      });

      if (error) {
        setError(uyelikHatasi(error.message));
      } else {
        router.push('/');
        router.refresh();
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
      </div>
    </div>
  );
}
