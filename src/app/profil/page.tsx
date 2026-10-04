"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Firma } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/client';

// Oturumlu okuma: kendi onay bekleyen firmalarını da görebilsin
const supabase = createClient();
import { useLanguage } from "@/contexts/LanguageContext";
import FirmaSilPenceresi from '@/components/FirmaSilPenceresi';
import SahipYeniYorumlar from '@/components/SahipYeniYorumlar';

type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
};

export default function ProfilPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [islemFirmaId, setIslemFirmaId] = useState<number | null>(null);
  const [silinecekFirma, setSilinecekFirma] = useState<Firma | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        fetchFirmalar(data.user.email);
      } else {
        router.push('/giris');
      }
    } catch {
      router.push('/giris');
    } finally {
      setLoading(false);
    }
  };

  const fetchFirmalar = async (email: string) => {
    try {
      const { data } = await supabase
        .from('firmalar')
        .select('id, ad, sektor, sanayi_sitesi, onay_durumu, fotograf_url')
        .eq('kullanici_email', email)
        .order('created_at', { ascending: false });
      if (data) setFirmalar(data as Firma[]);
    } catch {
      // kullanici_email kolonu henüz eklenmemişse sessizce geç
    }
  };

  const yenidenGonder = async (firmaId: number) => {
    setIslemFirmaId(firmaId);
    const res = await fetch('/api/firma-yeniden-gonder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: firmaId }),
    });
    if (res.ok) {
      setFirmalar(prev => prev.map(f => f.id === firmaId ? { ...f, onay_durumu: 'beklemede', yeniden_gonderildi: true } : f));
    }
    setIslemFirmaId(null);
  };

  // Yayından kaldır (onaylı → pasif) veya tekrar yayına gönder (pasif → onay bekliyor)
  const yayinDurumu = async (firma: Firma, islem: 'kaldir' | 'geri_gonder') => {
    if (islem === 'kaldir' && !window.confirm(t.unpublishConfirm)) return;
    setIslemFirmaId(firma.id);
    setHata(null);
    try {
      const res = await fetch('/api/firma-sil-kullanici', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: firma.id, islem }),
      });
      const data = await res.json();
      if (res.ok) setFirmalar(prev => prev.map(f => f.id === firma.id ? { ...f, onay_durumu: data.onay_durumu } : f));
      else setHata(data.error || 'İşlem başarısız.');
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.');
    }
    setIslemFirmaId(null);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/');
      } else {
        setLoggingOut(false);
      }
    } catch {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1a3a6b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a3a6b] to-[#0f2548] px-6 py-8 text-white">
          <h1 className="text-3xl font-bold mb-2">{t.profileTitle}</h1>
          <p className="text-gray-200">{t.profileSubtitle}</p>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Avatar and Name */}
          <div className="flex items-start gap-6 mb-8 pb-8 border-b">
            <div className="relative flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  referrerPolicy="no-referrer"
                  alt={user.name}
                  className="w-24 h-24 rounded-full border-4 border-[#e8a020]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#1a3a6b] flex items-center justify-center text-white text-3xl font-bold border-4 border-[#e8a020]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-[#1a3a6b] mb-1">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                {t.memberSince} {new Date(user.created_at).toLocaleDateString(t.memberSinceDateLocale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>

              {/* Firma kartları */}
              {firmalar.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.myCompanies}</p>
                  <div className="flex flex-col gap-2">
                    {firmalar.map(firma => {
                      const islem = islemFirmaId === firma.id;
                      const logoEl = firma.fotograf_url ? (
                        <img src={firma.fotograf_url} alt={firma.ad} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#1a3a6b] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {firma.ad.charAt(0)}
                        </div>
                      );

                      if (firma.onay_durumu === 'reddedildi') {
                        return (
                          <div key={firma.id} className="p-3 bg-red-50 rounded-xl border border-red-200">
                            <div className="flex items-center gap-3 mb-2">
                              {logoEl}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#1a3a6b] text-sm truncate">{firma.ad}</p>
                                <p className="text-xs text-gray-500 truncate">{firma.sektor} · {firma.sanayi_sitesi}</p>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium bg-red-100 text-red-700">{t.rejectedStatus}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => yenidenGonder(firma.id)}
                                disabled={islem}
                                className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[#1a3a6b] hover:bg-[#2554a0] text-white transition-colors disabled:opacity-50"
                              >
                                {islem ? '...' : t.resubmitBtn}
                              </button>
                              <button
                                onClick={() => setSilinecekFirma(firma)}
                                disabled={islem}
                                className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors disabled:opacity-50"
                              >
                                {islem ? '...' : t.removeBtn}
                              </button>
                            </div>
                          </div>
                        );
                      }

                      const pasif = firma.onay_durumu === 'pasif';
                      return (
                        <div key={firma.id} className={`rounded-xl border ${pasif ? 'bg-gray-50 border-gray-200' : 'bg-[#f0f4fa] border-[#d0daea]'}`}>
                          {pasif ? (
                            <div className="flex items-center gap-3 p-3 opacity-70">
                              {logoEl}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#1a3a6b] text-sm truncate">{firma.ad}</p>
                                <p className="text-xs text-gray-500 truncate">{firma.sektor} · {firma.sanayi_sitesi}</p>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium bg-gray-200 text-gray-600">{t.unpublishedStatus}</span>
                            </div>
                          ) : (
                            <Link
                              href={`/firma/${firma.id}`}
                              className="flex items-center gap-3 p-3 hover:bg-[#e2eaf6] rounded-t-xl transition-colors group"
                            >
                              {logoEl}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#1a3a6b] text-sm truncate group-hover:underline">{firma.ad}</p>
                                <p className="text-xs text-gray-500 truncate">{firma.sektor} · {firma.sanayi_sitesi}</p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                                firma.onay_durumu === 'onaylandi' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {firma.onay_durumu === 'onaylandi' ? t.approvedStatus : t.pendingStatus}
                              </span>
                            </Link>
                          )}
                          <div className="flex gap-2 px-3 pb-3">
                            {firma.onay_durumu === 'onaylandi' && (
                              <button onClick={() => yayinDurumu(firma, 'kaldir')} disabled={islem}
                                className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors disabled:opacity-50">
                                {islem ? '...' : t.unpublishBtn}
                              </button>
                            )}
                            {pasif && (
                              <button onClick={() => yayinDurumu(firma, 'geri_gonder')} disabled={islem}
                                className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[#1a3a6b] hover:bg-[#2554a0] text-white transition-colors disabled:opacity-50">
                                {islem ? '...' : t.republishBtn}
                              </button>
                            )}
                            <button onClick={() => setSilinecekFirma(firma)} disabled={islem}
                              className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 transition-colors disabled:opacity-50">
                              {t.deletePermanentBtn}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {hata && <p className="mt-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{hata}</p>}
                </div>
              )}
              {firmalar.length > 0 && <SahipYeniYorumlar />}
              {silinecekFirma && (
                <FirmaSilPenceresi
                  firmaId={silinecekFirma.id}
                  firmaAdi={silinecekFirma.ad}
                  adres="/api/firma-sil-kullanici"
                  onSilindi={() => {
                    setFirmalar(prev => prev.filter(f => f.id !== silinecekFirma.id));
                    setSilinecekFirma(null);
                  }}
                  onKapat={() => setSilinecekFirma(null)}
                />
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-[#1a3a6b] mb-4">{t.accountInfoTitle}</h3>

            <div className="bg-[#eef2f8] rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-700 block mb-1">{t.emailInfoLabel}</label>
              <p className="text-gray-900">{user.email}</p>
            </div>

            <div className="bg-[#eef2f8] rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-700 block mb-1">{t.fullNameInfoLabel}</label>
              <p className="text-gray-900">{user.name}</p>
            </div>

            <div className="bg-[#eef2f8] rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-700 block mb-1">{t.loginMethodLabel}</label>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-gray-900">{t.googleConnected}</span>
              </div>
            </div>
          </div>

          {/* Admin linki — sadece yöneticiye görünür */}
          {user.email === 'sadettinbal@gmail.com' && (
            <div className="mb-6">
              <a
                href="/admin"
                className="inline-flex items-center gap-2 bg-[#eef2f8] hover:bg-[#dde6f0] text-[#1a3a6b] font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t.adminPanelLink}
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {t.backToHomeBtn}
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loggingOut ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t.signingOutText}</span>
                </>
              ) : (
                t.signOutBtn
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
