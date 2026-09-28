'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { googleIleGiris } from '@/lib/uyelik';

// Üst menüdeki üyelik butonları: giriş yapılmadıysa Üye Ol / Giriş Yap / Google, yapıldıysa ad + Çıkış
export default function UyelikMenusu() {
  const [kullanici, setKullanici] = useState<User | null>(null);
  const [ad, setAd] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setKullanici(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_olay, oturum) => setKullanici(oturum?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!kullanici) {
      setAd('');
      return;
    }
    const meta = kullanici.user_metadata || {};
    setAd(meta.ad || meta.full_name || meta.name || kullanici.email || '');
    supabase
      .from('uyeler')
      .select('ad, soyad')
      .eq('id', kullanici.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.ad) setAd(`${data.ad} ${data.soyad || ''}`.trim());
      });
  }, [kullanici]);

  if (kullanici) {
    return (
      <>
        <span className="px-3 py-2 text-sm font-bold text-gray-700 flex items-center gap-1.5">
          <span>👤</span>
          <span className="max-w-[10rem] truncate">{ad}</span>
        </span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-all border-2 border-gray-300"
        >
          Çıkış
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/uye-ol"
        className="px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 rounded-xl transition-all shadow-md"
      >
        Üye Ol
      </Link>
      <Link
        href="/giris"
        className="px-3 py-2 text-sm font-bold text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all"
      >
        Giriş Yap
      </Link>
      <button
        onClick={googleIleGiris}
        className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-all flex items-center gap-2 border-2 border-gray-300"
      >
        <GoogleLogo />
        <span>Google ile Giriş Yap</span>
      </button>
    </>
  );
}

export function GoogleLogo() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
