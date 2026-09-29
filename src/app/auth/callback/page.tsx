"use client";

// Bu sayfa artık kullanılmıyor — tüm OAuth callback işlemi
// /api/auth/callback server route'unda @supabase/ssr ile yapılıyor.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a3a6b] to-[#0f2548]">
      <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
