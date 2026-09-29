"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

function GirisContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const msg = searchParams.get('msg');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);
  const [sifreHata, setSifreHata] = useState('');

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/google';
  };

  const handleSifreGiris = async (e: React.FormEvent) => {
    e.preventDefault();
    setSifreHata('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/sifre-giris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sifre }),
      });
      if (res.ok) {
        // Oturum çerezleri sunucuda yazıldı; sayfayı baştan yükle ki menü girişi görsün
        window.location.href = '/';
        return;
      }
      setSifreHata((await res.json()).error || 'Giriş yapılamadı.');
    } catch {
      setSifreHata('Giriş yapılamadı.');
    }
    setIsLoading(false);
  };

  const getErrorMessage = (errorCode: string | null) => {
    if (msg) return decodeURIComponent(msg);
    if (!errorCode) return null;
    return t.loginErrors[errorCode] ?? t.loginErrors['default'];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a3a6b] to-[#0f2548] px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1a3a6b] mb-2">
              {t.welcomeTitle}
            </h1>
            <p className="text-gray-600">
              {t.welcomeSubtitle}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">
                {getErrorMessage(error)}
              </p>
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-[#1a3a6b] hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1a3a6b] rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{t.continueGoogle}</span>
              </>
            )}
          </button>

          {/* E-posta ve şifre ile giriş */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">veya e-posta ile</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <form onSubmit={handleSifreGiris} className="space-y-3">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              aria-label="E-posta"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent outline-none"
            />
            <div className="relative">
              <input
                type={sifreGoster ? 'text' : 'password'}
                autoComplete="current-password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="Şifre"
                aria-label="Şifre"
                required
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setSifreGoster(!sifreGoster)}
                aria-label={sifreGoster ? 'Şifreyi gizle' : 'Şifreyi göster'}
                className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-[#1a3a6b] hover:text-[#e8a020]"
              >
                {sifreGoster ? 'Gizle' : 'Göster'}
              </button>
            </div>
            {sifreHata && <p className="text-sm text-red-600">{sifreHata}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1a3a6b] hover:bg-[#0f2548] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          {/* Info Text */}
          <p className="mt-6 text-xs text-gray-500 text-center">
            {t.privacyAgree}{' '}
            <a href="/gizlilik-politikasi" className="text-[#e8a020] hover:underline">
              {t.privacyPolicyLink}
            </a>
            {' '}{t.andWord}{' '}
            <a href="/kvkk" className="text-[#e8a020] hover:underline">
              {t.kvkkLink}
            </a>
            {' '}{t.termsEnd}
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-white hover:text-[#e8a020] transition-colors text-sm"
          >
            {t.backToHomeLink}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function GirisPage() {
  return (
    <Suspense>
      <GirisContent />
    </Suspense>
  );
}
