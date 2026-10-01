"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import DilSecici from "@/components/DilSecici";
import { useLanguage } from "@/contexts/LanguageContext";


type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
};

type FirmaOneri = { id: number; ad: string; sanayi_sitesi: string; sektor: string };

export default function Navbar() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FirmaOneri[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [kvkkModal, setKvkkModal] = useState(false);
  const [uyeOlModal, setUyeOlModal] = useState(false);
  const [uyeOlForm, setUyeOlForm] = useState({ isim: '', soyisim: '', sabit_telefon: '', mobil_telefon: '', email: '' });
  const [uyeOlYukleniyor, setUyeOlYukleniyor] = useState(false);
  const [uyeOlMesaj, setUyeOlMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null);
  const [siteKullanimiModal, setSiteKullanimiModal] = useState(false);
  const [siteKullanimiIcerik, setSiteKullanimiIcerik] = useState('');
  const [siteKullanimiYukleniyor, setSiteKullanimiYukleniyor] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { listening, supported, start, stop } = useSpeechToText((text) => {
    setQuery(text);
    if (text.trim()) {
      router.push(`/firmalar?ara=${encodeURIComponent(text.trim())}`);
    }
  });

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => {
        if (!prev && y > 150) return true;
        if (prev && y < 80) return false;
        return prev;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => { if (data.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const { data } = await createBrowserClient()
        .from("firmalar")
        .select("id, ad, sanayi_sitesi, sektor")
        .or(`ad.ilike.%${q}%,sektor.ilike.%${q}%,sanayi_sitesi.ilike.%${q}%`)
        .not("ad", "ilike", "(Firma%")
        .eq("onay_durumu", "onaylandi")
        .limit(8);
      const results = data || [];
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIdx(-1);
    }, 250);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    if (query.trim()) {
      router.push(`/firmalar?ara=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); router.push(`/firma/${suggestions[activeIdx].id}`); setOpen(false); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  async function siteKullanimiAc() {
    setSiteKullanimiModal(true);
    setSiteKullanimiYukleniyor(true);
    try {
      const res = await fetch('/api/site-kullanimi');
      const data = await res.json();
      setSiteKullanimiIcerik(data.icerik || '');
    } catch {
      setSiteKullanimiIcerik('');
    } finally {
      setSiteKullanimiYukleniyor(false);
    }
  }

  async function handleUyeOlSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUyeOlMesaj(null);
    const { isim, soyisim, sabit_telefon, mobil_telefon, email } = uyeOlForm;
    if (!isim || !soyisim || !sabit_telefon || !mobil_telefon || !email) {
      setUyeOlMesaj({ tip: 'hata', metin: 'Tüm alanlar zorunludur.' });
      return;
    }
    setUyeOlYukleniyor(true);
    try {
      const res = await fetch('/api/uye-ol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isim, soyisim, sabit_telefon, mobil_telefon, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setUyeOlMesaj({ tip: 'basari', metin: 'Başvurunuz alındı. Onaylandıktan sonra üyeliğiniz başlayacak.' });
        setUyeOlForm({ isim: '', soyisim: '', sabit_telefon: '', mobil_telefon: '', email: '' });
      } else {
        setUyeOlMesaj({ tip: 'hata', metin: data.error || 'Bir hata oluştu.' });
      }
    } catch {
      setUyeOlMesaj({ tip: 'hata', metin: 'Bağlantı hatası.' });
    } finally {
      setUyeOlYukleniyor(false);
    }
  }

  const linksOnce = [
    { href: "/", label: t.navHome },
    { href: "/firmalar", label: t.navCompanies },
    { href: "/konum", label: t.navLocation },
    { href: "/ozel-firmalar", label: t.navFeatured },
    { href: "/ilanlar", label: t.navListings },
    { href: "/firma-ekle", label: t.navAddCompany },
    { href: "/iletisim", label: t.navContact },
  ];
  const linksSonra: { href: string; label: string }[] = [];

  return (
    <>
    <header className="sticky top-0 z-50 bg-[#1a3a6b] shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 transition-all duration-300 py-2">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-white rounded px-3 py-1">
            <Image
              src="/kovan-logo.svg"
              alt="Kovan Portal"
              width={120} height={48}
              className={`w-auto transition-all duration-300 ${scrolled ? "h-8" : "h-12"}`}
              unoptimized
            />
          </div>
        </Link>

        {/* Kompakt arama — scroll sonrası */}
        <form onSubmit={handleSearch} className={`flex-1 flex gap-1 transition-all duration-300 ${scrolled ? "opacity-100 max-w-xl" : "opacity-0 max-w-0 overflow-hidden pointer-events-none"}`}>
          <div className="flex-1 relative min-w-0" ref={wrapperRef}>
            <input
              type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setOpen(true)}
              placeholder={listening ? t.searchListening : t.searchNavPlaceholder}
              className={`w-full px-3 py-1.5 pr-9 rounded text-sm outline-none border-2 transition-colors ${listening ? "border-red-400 bg-red-50" : "border-transparent focus:border-[#e8a020]"}`}
            />
            {supported !== false && (
              <button type="button" onClick={listening ? stop : start}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${listening ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:bg-gray-100 hover:text-[#1a3a6b]"}`}>
                <MicIcon size="sm" />
              </button>
            )}
            {open && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] text-left overflow-hidden">
                {suggestions.map((firma, i) => (
                  <li key={firma.id}>
                    <Link href={`/firma/${firma.id}`} onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${i === activeIdx ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                      <span className="w-6 h-6 rounded bg-[#1a3a6b] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                        {firma.ad.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate text-xs">{firma.ad}</div>
                        <div className="text-xs text-gray-400 truncate">{firma.sanayi_sitesi}{firma.sektor ? ` · ${firma.sektor}` : ""}</div>
                      </div>
                    </Link>
                  </li>
                ))}
                <li className="border-t border-gray-100">
                  <button type="submit" className="w-full text-center px-3 py-2 text-xs text-[#1a3a6b] font-semibold hover:bg-blue-50 transition-colors">
                    {t.seeAllResults(query)}
                  </button>
                </li>
              </ul>
            )}
          </div>
          <button type="submit" className="bg-[#e8a020] hover:bg-[#c8851a] text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors flex-shrink-0">🔍</button>
        </form>

        {/* Desktop nav */}
        <nav className={`hidden md:flex items-center gap-0.5 ${scrolled ? "flex-shrink-0" : "flex-1 justify-center"}`}>
          {linksOnce.map((link) => (
            <Link key={link.href} href={link.href}
              className={`text-white rounded hover:bg-[#2554a0] transition-colors whitespace-nowrap ${scrolled ? "text-[13px] px-2 py-1.5" : "text-[15px] px-3 py-2"}`}>
              {link.label}
            </Link>
          ))}
          <button
            onClick={siteKullanimiAc}
            className={`text-white rounded hover:bg-[#2554a0] transition-colors whitespace-nowrap ${scrolled ? "text-[13px] px-2 py-1.5" : "text-[15px] px-3 py-2"}`}>
            Site Kullanımı
          </button>
          <button
            onClick={() => { setUyeOlModal(true); setUyeOlMesaj(null); }}
            className={`text-[#1a3a6b] bg-[#e8a020] hover:bg-[#c8851a] rounded font-semibold transition-colors whitespace-nowrap ${scrolled ? "text-[13px] px-2 py-1.5" : "text-[15px] px-3 py-2"}`}>
            Üye Ol
          </button>
          {linksSonra.map((link) => (
            <Link key={link.href} href={link.href}
              className={`text-white rounded hover:bg-[#2554a0] transition-colors whitespace-nowrap ${scrolled ? "text-[13px] px-2 py-1.5" : "text-[15px] px-3 py-2"}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Dil Seçici — her zaman görünür */}
        <div className="hidden md:block flex-shrink-0">
          <DilSecici />
        </div>

        {/* User Menu */}
        <div className="hidden md:block relative flex-shrink-0" ref={userMenuRef}>
          {user ? (
            <button onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 text-white hover:bg-[#2554a0] rounded transition-colors px-2 py-1.5">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className={`rounded-full ${scrolled ? "w-6 h-6" : "w-8 h-8"}`} />
              ) : (
                <div className={`rounded-full bg-[#e8a020] text-white font-bold flex items-center justify-center ${scrolled ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"}`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className={scrolled ? "text-[13px]" : "text-[15px]"}>{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button onClick={() => setKvkkModal(true)}
              className={`flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded transition-colors whitespace-nowrap shadow-sm ${scrolled ? "text-[13px] px-2.5 py-1.5" : "text-[15px] px-3 py-2"}`}>
              <GoogleIcon size={scrolled ? 14 : 16} />
              <span>{t.signInGoogle}</span>
            </button>
          )}
          {userMenuOpen && user && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
              <Link href="/profil" onClick={() => setUserMenuOpen(false)}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100">
                {t.myProfile}
              </Link>
              <button onClick={async () => { setUserMenuOpen(false); await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); router.push('/'); }}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                {t.signOut}
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white p-2 ml-auto" onClick={() => setMenuOpen(!menuOpen)} aria-label={t.openMenu}>
          <div className="space-y-1">
            <span className="block w-5 h-0.5 bg-white"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0f2548] border-t border-[#2554a0]">
          <form onSubmit={handleSearch} className="flex gap-2 px-4 py-2">
            <div className="flex-1 relative">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={listening ? t.searchListening : t.searchNavShort}
                className={`w-full px-3 py-2 pr-9 rounded text-sm outline-none border-2 transition-colors ${listening ? "border-red-400 bg-red-50" : "border-transparent"}`}
              />
              {supported !== false && (
                <button type="button" onClick={listening ? stop : start}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${listening ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:bg-gray-100"}`}>
                  <MicIcon size="sm" />
                </button>
              )}
            </div>
            <button type="submit" className="bg-[#e8a020] text-white px-3 py-2 rounded text-sm">🔍</button>
          </form>
          {linksOnce.map((link) => (
            <Link key={link.href} href={link.href}
              className="block text-white px-4 py-3 text-base border-b border-[#1a3a6b] hover:bg-[#1a3a6b] transition-colors"
              onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => { setMenuOpen(false); siteKullanimiAc(); }}
            className="block w-full text-left text-white px-4 py-3 text-base border-b border-[#1a3a6b] hover:bg-[#1a3a6b] transition-colors">
            Site Kullanımı
          </button>
          <button
            onClick={() => { setMenuOpen(false); setUyeOlModal(true); setUyeOlMesaj(null); }}
            className="block w-full text-left text-[#e8a020] font-semibold px-4 py-3 text-base border-b border-[#1a3a6b] hover:bg-[#1a3a6b] transition-colors">
            Üye Ol
          </button>
          {linksSonra.map((link) => (
            <Link key={link.href} href={link.href}
              className="block text-white px-4 py-3 text-base border-b border-[#1a3a6b] hover:bg-[#1a3a6b] transition-colors"
              onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/profil" className="block text-white px-4 py-3 text-base border-b border-[#1a3a6b] hover:bg-[#1a3a6b] transition-colors" onClick={() => setMenuOpen(false)}>{t.myProfile}</Link>
              <button onClick={async () => { setMenuOpen(false); await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); router.push('/'); }}
                className="block w-full text-left text-red-400 px-4 py-3 text-base hover:bg-[#1a3a6b] transition-colors">
                {t.signOut}
              </button>
            </>
          ) : (
            <button onClick={() => { setMenuOpen(false); setKvkkModal(true); }} className="flex items-center gap-2 px-4 py-3 text-base bg-white hover:bg-gray-100 text-gray-700 font-semibold transition-colors w-full">
              <GoogleIcon size={16} />
              <span>{t.signInGoogle}</span>
            </button>
          )}
          <div className="px-4 py-3 border-t border-[#1a3a6b]">
            <DilSecici />
          </div>
        </div>
      )}

      {/* KVKK Modal */}
      {kvkkModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setKvkkModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#1a3a6b] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">{t.kvkkTitle}</h2>
                <p className="text-xs text-gray-500">{t.kvkkSubtitle}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 leading-relaxed max-h-52 overflow-y-auto mb-5 border border-gray-200">
              <p className="font-semibold text-gray-700 mb-2">{t.kvkkP1Title}</p>
              <p className="mb-3">{t.kvkkP1}</p>
              <p className="font-semibold text-gray-700 mb-2">{t.kvkkP2Title}</p>
              <p className="mb-3">{t.kvkkP2}</p>
              <p>{t.kvkkP3}</p>
            </div>

            <p className="text-center text-xs text-gray-500 mb-4">{t.kvkkAcceptText}</p>

            <div className="flex gap-3">
              <button onClick={() => setKvkkModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                {t.kvkkCancelBtn}
              </button>
              <button onClick={() => { setKvkkModal(false); handleGoogleLogin(); }}
                className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <GoogleIcon size={15} />
                {t.kvkkContinueBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Site Kullanımı Modal */}
      {siteKullanimiModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSiteKullanimiModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSiteKullanimiModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
            <h2 className="text-lg font-bold text-[#1a3a6b] mb-4">Site Kullanımı</h2>
            {siteKullanimiYukleniyor ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#1a3a6b] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : siteKullanimiIcerik ? (
              <div className="overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {siteKullanimiIcerik}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">Henüz içerik eklenmemiş.</p>
            )}
          </div>
        </div>
      )}

      {/* Üye Ol Modal */}
      {uyeOlModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setUyeOlModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setUyeOlModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
            <h2 className="text-lg font-bold text-[#1a3a6b] mb-1">Üye Ol</h2>
            <p className="text-xs text-gray-500 mb-4">Tüm alanların doldurulması zorunludur.</p>

            {uyeOlMesaj && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                uyeOlMesaj.tip === 'basari'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {uyeOlMesaj.metin}
              </div>
            )}

            {uyeOlMesaj?.tip !== 'basari' && (
              <form onSubmit={handleUyeOlSubmit} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">İsim</label>
                  <input type="text" value={uyeOlForm.isim} onChange={e => setUyeOlForm(f => ({ ...f, isim: e.target.value }))}
                    required placeholder="Adınız"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Soyisim</label>
                  <input type="text" value={uyeOlForm.soyisim} onChange={e => setUyeOlForm(f => ({ ...f, soyisim: e.target.value }))}
                    required placeholder="Soyadınız"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sabit Telefon</label>
                  <input type="tel" value={uyeOlForm.sabit_telefon} onChange={e => setUyeOlForm(f => ({ ...f, sabit_telefon: e.target.value }))}
                    required placeholder="0212 000 00 00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mobil Telefon</label>
                  <input type="tel" value={uyeOlForm.mobil_telefon} onChange={e => setUyeOlForm(f => ({ ...f, mobil_telefon: e.target.value }))}
                    required placeholder="0532 000 00 00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-posta</label>
                  <input type="email" value={uyeOlForm.email} onChange={e => setUyeOlForm(f => ({ ...f, email: e.target.value }))}
                    required placeholder="ornek@email.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]" />
                </div>
                <div className="col-span-2">
                  <button type="submit" disabled={uyeOlYukleniyor}
                    className="w-full bg-[#1a3a6b] hover:bg-[#2554a0] disabled:bg-gray-400 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                    {uyeOlYukleniyor ? 'Gönderiliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </header>

  </>
  );
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function MicIcon({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
      <path d="M6.25 10a.75.75 0 0 1 .75.75 5 5 0 0 0 10 0 .75.75 0 0 1 1.5 0 6.5 6.5 0 0 1-5.75 6.45V19.5h2.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h2.5v-2.305A6.5 6.5 0 0 1 5.5 10.75.75.75 0 0 1 6.25 10z" />
    </svg>
  );
}
