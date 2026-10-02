'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { Firma } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/client';

// Oturumlu okuma: yönetici, onay bekleyen firma ve ilanları da görebilsin (veritabanı kuralları)
const supabase = createClient();
import ActiveUsers from '@/components/ActiveUsers';
import SanayiSiteleriYonetimi from '@/components/admin/SanayiSiteleriYonetimi';
import KategoriYonetimi from '@/components/admin/KategoriYonetimi';
import FirmaEkleFormu from '@/components/FirmaEkleFormu';
import FirmaSilPenceresi from '@/components/FirmaSilPenceresi';
import { AdminYeniYorumlar, AdminSikayetler } from '@/components/AdminYorumSekmeleri';
import { gunBaslangici, gunSonu, musteriFavorisiMi, ozelDurum, tarihKutusu, type OzelDurum } from '@/lib/ozelFirma';

// Özel Firma (sponsorlu) durumunu yönetici paneli için kısa yazıya çevirir
function ozelDurumYazisi(d: OzelDurum, bitis?: string | null): string {
  const bit = bitis ? new Date(bitis).toLocaleDateString('tr-TR') : '';
  if (d.durum === 'aktif') return `💎 Özel Firma · aktif, ${d.kalanGun} gün kaldı (bitiş ${bit})`;
  if (d.durum === 'baslamadi') return '💎 Özel Firma · henüz başlamadı';
  if (d.durum === 'doldu') return `💎 Özel Firma · süresi doldu (${bit})`;
  return '';
}
import SosyalIkon from '@/components/SosyalIkon';

import { ADMIN_EMAILS } from '@/lib/admin';
import { aktifKategoriler } from '@/lib/firmaKategorileri';

type AuthState = 'loading' | 'unauthenticated' | 'unauthorized' | 'authorized';

type Ilan = {
  id: number;
  baslik: string;
  aciklama: string;
  kategori: string;
  fiyat: string | null;
  telefon: string;
  ilan_veren_ad: string;
  ilan_veren_email: string | null;
  fotograflar: string[] | null;
  onay_durumu: string;
  created_at: string;
};

type Uye = {
  id: string;
  ad: string;
  email: string;
  avatar_url?: string | null;
  telefon?: string | null;
  kaynak?: string;
  created_at: string;
};

// ─── Yükleniyor ──────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#1a3a6b] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── Giriş Yapılmamış ────────────────────────────────────────────────────────
function LoginScreen() {
  const [kvkk, setKvkk] = useState(false);

  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-[#1a3a6b] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#1a3a6b] mb-1">Admin Paneli</h1>
        <p className="text-sm text-gray-500 mb-6">Devam etmek için giriş yapmanız gerekiyor.</p>
        <button
          onClick={() => setKvkk(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm"
        >
          <GoogleIcon />
          Google ile Giriş Yap
        </button>
      </div>

      {/* KVKK Modal */}
      {kvkk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setKvkk(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-800 mb-1">Gizlilik ve KVKK Bildirimi</h2>
            <p className="text-xs text-gray-500 mb-4">Google ile giriş yapmadan önce lütfen okuyunuz</p>
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 leading-relaxed max-h-44 overflow-y-auto mb-5 border border-gray-200">
              Google hesabınız aracılığıyla giriş yaptığınızda <strong>ad-soyad</strong> ve <strong>e-posta adresiniz</strong> sistemimize kaydedilecektir. Bu bilgiler yalnızca hizmet amaçlı kullanılır; üçüncü şahıslarla paylaşılmaz. 6698 sayılı KVKK kapsamında işlenmektedir.
            </div>
            <p className="text-center text-xs text-gray-500 mb-4"><strong>&quot;Devam Et&quot;</strong> ile KVKK metnini kabul etmiş olursunuz.</p>
            <div className="flex gap-3">
              <button onClick={() => setKvkk(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">İptal</button>
              <button onClick={() => { setKvkk(false); handleLogin(); }} className="flex-1 py-2.5 rounded-xl bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <GoogleIcon light /> Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Erişim Reddedildi ───────────────────────────────────────────────────────
function AccessDeniedScreen() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Erişim Reddedildi</h1>
        <p className="text-sm text-gray-500 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor. Yalnızca yetkili hesaplar admin paneline girebilir.</p>
        <button
          onClick={handleLogout}
          className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        >
          Çıkış Yap ve Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}

// ─── Güncelleme Talepleri ─────────────────────────────────────────────────────
type BekleyenGuncellemeTip = Firma & { bekleyen_degisiklikler: Record<string, unknown>; guncelleme_talep_tarihi: string };

const GUNCELLEME_ALAN_ETIKETLER: Record<string, string> = {
  ad: 'Firma Adı', sahip: 'Sahip/Yetkili', sektor: 'Sektör', sanayi_sitesi: 'Sanayi Sitesi',
  telefon: 'Telefon', mobil_telefon: 'Mobil Telefon', whatsapp: 'WhatsApp', adres: 'Adres', hizmetler: 'Hizmetler', aciklama: 'Hakkında',
  web_sitesi: 'Web Sitesi', instagram: 'Instagram', facebook: 'Facebook',
  twitter: 'X (Twitter)', youtube: 'YouTube', linkedin: 'LinkedIn', tiktok: 'TikTok', eposta: 'E-posta', nsosyal: 'N Sosyal',
};

function BekleyenGuncellemeler({ onSayi }: { onSayi: (n: number) => void }) {
  const [liste, setListe] = useState<BekleyenGuncellemeTip[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islem, setIslem] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('firmalar')
      .select('*')
      .not('bekleyen_degisiklikler', 'is', null)
      .order('guncelleme_talep_tarihi', { ascending: false })
      .then(({ data }) => {
        const items = (data || []) as BekleyenGuncellemeTip[];
        setListe(items);
        onSayi(items.length);
        setYukleniyor(false);
      });
  }, [onSayi]);

  async function islemYap(id: number, tip: 'onayla' | 'reddet') {
    setIslem(id);
    const res = await fetch('/api/admin/firma-guncelleme-onayla', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, islem: tip }),
    });
    if (res.ok) {
      const yeni = liste.filter(f => f.id !== id);
      setListe(yeni);
      onSayi(yeni.length);
    }
    setIslem(null);
  }

  if (yukleniyor) return <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor...</div>;

  if (liste.length === 0) return (
    <div className="p-12 text-center">
      <div className="text-4xl mb-3">✅</div>
      <p className="text-gray-500 text-sm">Onay bekleyen güncelleme talebi yok.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {liste.map(firma => {
        const bekleyen = firma.bekleyen_degisiklikler;
        const degisiklikler = Object.entries(bekleyen).filter(([key, val]) => {
          const mevcutDeger = (firma as Record<string, unknown>)[key];
          const mevcutStr = Array.isArray(mevcutDeger) ? mevcutDeger.join(', ') : String(mevcutDeger ?? '');
          const yeniStr = Array.isArray(val) ? val.join(', ') : String(val ?? '');
          return mevcutStr !== yeniStr;
        });

        return (
          <div key={firma.id} className="bg-white border border-orange-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-[#1a3a6b] text-base">{firma.ad}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {firma.kullanici_email} · {firma.guncelleme_talep_tarihi ? new Date(firma.guncelleme_talep_tarihi).toLocaleString('tr-TR') : ''}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => islemYap(firma.id, 'onayla')} disabled={islem === firma.id}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {islem === firma.id ? '...' : '✓ Onayla'}
                </button>
                <button onClick={() => islemYap(firma.id, 'reddet')} disabled={islem === firma.id}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                  ✕ Reddet
                </button>
              </div>
            </div>

            {degisiklikler.length === 0 ? (
              <p className="text-xs text-gray-400">Değişen alan bulunamadı.</p>
            ) : (
              <div className="space-y-2">
                {degisiklikler.map(([key, yeniDeger]) => {
                  const mevcutDeger = (firma as Record<string, unknown>)[key];
                  const mevcutStr = Array.isArray(mevcutDeger) ? mevcutDeger.join(', ') : String(mevcutDeger ?? '—');
                  const yeniStr = Array.isArray(yeniDeger) ? yeniDeger.join(', ') : String(yeniDeger ?? '—');
                  const etiket = GUNCELLEME_ALAN_ETIKETLER[key] || key;
                  return (
                    <div key={key} className="grid grid-cols-[120px_1fr_1fr] gap-2 text-xs border border-gray-100 rounded-lg p-2 bg-gray-50">
                      <span className="font-semibold text-gray-600 self-start pt-0.5">{etiket}</span>
                      <div>
                        <span className="text-gray-400 text-[10px] block mb-0.5">Mevcut</span>
                        <span className="text-gray-700 line-through">{mevcutStr}</span>
                      </div>
                      <div>
                        <span className="text-green-600 text-[10px] block mb-0.5">Yeni</span>
                        <span className="text-green-800 font-medium">{yeniStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Onay Bekleyenler ────────────────────────────────────────────────────────
function BekleyenFirmalar() {
  const [bekleyenler, setBekleyenler] = useState<Firma[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islem, setIslem] = useState<number | null>(null);

  useEffect(() => {
    // RLS nedeniyle 'beklemede' kayıtlar anon key ile okunamıyor;
    // service-role kullanan admin endpoint'inden çekiyoruz.
    fetch('/api/admin/onay-bekleyenler')
      .then(res => res.ok ? res.json() : { firmalar: [] })
      .then(data => { setBekleyenler(data.firmalar || []); setYukleniyor(false); })
      .catch(() => setYukleniyor(false));
  }, []);

  async function guncelle(id: number, durum: 'onaylandi' | 'reddedildi') {
    // Yeni kategori öneren firma: kategori Kategori Yönetimi'nde eklenmeden sunucu onaylamaz ve nedenini söyler
    setIslem(id);
    const res = await fetch('/api/admin/firma-durum', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, durum }),
    });
    if (res.ok) {
      setBekleyenler(prev => prev.filter(f => f.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`⚠️ ${data.error || 'İşlem yapılamadı.'}`);
    }
    setIslem(null);
  }

  if (yukleniyor) return <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor...</div>;

  if (bekleyenler.length === 0) return (
    <div className="p-12 text-center">
      <div className="text-4xl mb-3">✅</div>
      <p className="text-gray-500 text-sm">Onay bekleyen firma yok.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {bekleyenler.map(firma => (
        <div key={firma.id} className={`bg-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${firma.yeni_kategori ? 'border-2 border-orange-400' : 'border border-gray-200'}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-[#1a3a6b] text-base">{firma.ad}</h3>
              {firma.yeni_kategori && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  ⚠️ YENİ KATEGORİ
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
              <span>🏭 {firma.sanayi_sitesi}</span>
              <span className={firma.yeni_kategori ? 'text-orange-600 font-semibold' : ''}>
                🏷️ {firma.sektor}
                {firma.yeni_kategori && (
                  <span className="text-xs ml-1">({firma.yeni_kategori_tipi === 'siteli' ? 'Sanayi Sitesi İçi' : 'Sanayi Sitesi Dışı'})</span>
                )}
              </span>
              {firma.telefon && <span>📞 {firma.telefon}</span>}
              {firma.sahip && <span>👤 {firma.sahip}</span>}
            </div>
            {firma.yeni_kategori && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
                <p className="text-xs text-orange-800">
                  <strong>⚠️ Dikkat:</strong> Bu firma sistemde olmayan yeni bir kategori önermiş. Firmayı onaylamadan önce "Kategoriler" sekmesinden bu kategoriyi sisteme eklemelisiniz.
                </p>
              </div>
            )}
            {firma.adres && <p className="text-xs text-gray-400 mt-1">📍 {firma.adres}</p>}
            <p className="text-xs text-gray-300 mt-1">{new Date(firma.created_at).toLocaleString('tr-TR')}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => guncelle(firma.id, 'onaylandi')} disabled={islem === firma.id}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {islem === firma.id ? '...' : '✓ Onayla'}
            </button>
            <button onClick={() => guncelle(firma.id, 'reddedildi')} disabled={islem === firma.id}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              ✕ Reddet
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Bekleyen İlanlar ────────────────────────────────────────────────────────
function BekleyenIlanlar() {
  const [bekleyenler, setBekleyenler] = useState<Ilan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islem, setIslem] = useState<number | null>(null);

  useEffect(() => {
    // RLS nedeniyle 'beklemede' kayıtlar anon key ile okunamıyor;
    // service-role kullanan admin endpoint'inden çekiyoruz.
    fetch('/api/admin/onay-bekleyenler')
      .then(res => res.ok ? res.json() : { ilanlar: [] })
      .then(data => { setBekleyenler(data.ilanlar || []); setYukleniyor(false); })
      .catch(() => setYukleniyor(false));
  }, []);

  async function guncelle(id: number, durum: 'onaylandi' | 'reddedildi') {
    setIslem(id);
    const res = await fetch('/api/admin/ilan-durum', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, durum }),
    });
    if (res.ok) {
      setBekleyenler(prev => prev.filter(i => i.id !== id));
    }
    setIslem(null);
  }

  if (yukleniyor) return <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor...</div>;

  if (bekleyenler.length === 0) return (
    <div className="p-12 text-center">
      <div className="text-4xl mb-3">✅</div>
      <p className="text-gray-500 text-sm">Onay bekleyen ilan yok.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {bekleyenler.map(ilan => (
        <div key={ilan.id} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#1a3a6b] text-base">{ilan.baslik}</h3>
              <p className="text-sm text-gray-600 mt-1 mb-2">{ilan.aciklama}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">{ilan.kategori}</span>
                {ilan.fiyat && <span>💰 {ilan.fiyat}</span>}
                <span>📞 {ilan.telefon}</span>
                <span>👤 {ilan.ilan_veren_ad}</span>
                {ilan.ilan_veren_email && <span>✉️ {ilan.ilan_veren_email}</span>}
              </div>
              <p className="text-xs text-gray-300 mt-1">{new Date(ilan.created_at).toLocaleString('tr-TR')}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => guncelle(ilan.id, 'onaylandi')} disabled={islem === ilan.id}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {islem === ilan.id ? '...' : '✓ Onayla'}
              </button>
              <button onClick={() => guncelle(ilan.id, 'reddedildi')} disabled={islem === ilan.id}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                ✕ Reddet
              </button>
            </div>
          </div>
          {ilan.fotograflar && ilan.fotograflar.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {ilan.fotograflar.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Fotoğraf ${i + 1}`}
                  className="w-24 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Site Kullanımı Yönetimi ─────────────────────────────────────────────────
function SiteKullanimiYonetimi() {
  const [icerik, setIcerik] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/site-kullanimi')
      .then(r => r.json())
      .then(d => setIcerik(d.icerik || ''))
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  async function kaydet() {
    setKaydediliyor(true);
    setMesaj(null);
    try {
      const res = await fetch('/api/admin/site-kullanimi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icerik }),
      });
      if (res.ok) setMesaj({ tip: 'basari', metin: 'İçerik kaydedildi.' });
      else setMesaj({ tip: 'hata', metin: 'Kaydetme başarısız.' });
    } catch {
      setMesaj({ tip: 'hata', metin: 'Sunucu hatası.' });
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-lg font-bold text-[#1a3a6b] mb-1">Site Kullanımı</h2>
      <p className="text-sm text-gray-500 mb-4">Sitedeki &quot;Site Kullanımı&quot; butonuna tıklandığında ziyaretçilere gösterilecek içeriği buradan yazın.</p>
      {mesaj && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${mesaj.tip === 'basari' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mesaj.metin}
        </div>
      )}
      {yukleniyor ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-[#1a3a6b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <textarea
            value={icerik}
            onChange={e => setIcerik(e.target.value)}
            rows={16}
            placeholder="Site kullanım rehberini buraya yazın..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] resize-y"
          />
          <button
            onClick={kaydet}
            disabled={kaydediliyor}
            className="mt-3 bg-[#1a3a6b] hover:bg-[#2554a0] disabled:bg-gray-400 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Reklam Yönetimi ─────────────────────────────────────────────────────────
type Reklam = {
  id: number;
  baslik: string;
  gorsel_url: string;
  link_url: string;
  konum: 'video' | 'sidebar' | 'popup' | 'anasayfa_ust';
  kategori: string | null;
  aktif: boolean;
  baslangic_tarihi: string | null;
  bitis_tarihi: string | null;
  siralama: number;
  tiklanma: number;
  created_at: string;
};

function ReklamYonetimi() {
  const [reklamlar, setReklamlar] = useState<Reklam[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null);

  const [baslik, setBaslik] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [konum, setKonum] = useState<'video' | 'sidebar' | 'popup' | 'anasayfa_ust'>('video');
  const [kategori, setKategori] = useState('');
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');
  const [dosya, setDosya] = useState<File | null>(null);
  const [onizleme, setOnizleme] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  function yukle() {
    setYukleniyor(true);
    fetch('/api/admin/reklam')
      .then(r => r.json())
      .then(d => setReklamlar(d.reklamlar || []))
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }
  useEffect(() => { yukle(); }, []);

  // Kategori dropdown'ı için firmalardan benzersiz sektörleri çek
  useEffect(() => {
    async function kategorileriGetir() {
      const degerler: string[] = [];
      const CHUNK = 1000;
      let from = 0;
      while (true) {
        const { data } = await supabase.from('firmalar').select('sektor').range(from, from + CHUNK - 1);
        if (!data || data.length === 0) break;
        data.forEach((row: { sektor?: string }) => { if (row.sektor) degerler.push(row.sektor); });
        if (data.length < CHUNK) break;
        from += CHUNK;
      }
      setKategoriler(Array.from(new Set(degerler)).sort());
    }
    kategorileriGetir();
  }, []);

  function dosyaSec(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setDosya(f);
    setOnizleme(URL.createObjectURL(f));
  }

  async function ekle() {
    if (!dosya) { setMesaj({ tip: 'hata', metin: 'Lütfen bir görsel seçin.' }); return; }
    setKaydediliyor(true);
    setMesaj(null);
    try {
      const fd = new FormData();
      fd.append('file', dosya);
      const up = await fetch('/api/admin/reklam/foto', { method: 'POST', body: fd });
      const upData = await up.json();
      if (!up.ok) { setMesaj({ tip: 'hata', metin: upData.error || 'Görsel yüklenemedi.' }); setKaydediliyor(false); return; }

      const res = await fetch('/api/admin/reklam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baslik,
          link_url: linkUrl,
          konum,
          kategori: kategori || null,
          gorsel_url: upData.url,
          aktif: true,
          baslangic_tarihi: baslangic || null,
          bitis_tarihi: bitis || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMesaj({ tip: 'hata', metin: data.error || 'Kaydedilemedi.' });
      } else {
        setMesaj({ tip: 'basari', metin: 'Reklam eklendi.' });
        setBaslik(''); setLinkUrl(''); setKategori(''); setBaslangic(''); setBitis(''); setDosya(null); setOnizleme('');
        yukle();
      }
    } catch {
      setMesaj({ tip: 'hata', metin: 'Sunucu hatası.' });
    } finally {
      setKaydediliyor(false);
    }
  }

  async function aktifDegistir(r: Reklam) {
    await fetch('/api/admin/reklam', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, aktif: !r.aktif }),
    });
    setReklamlar(prev => prev.map(x => x.id === r.id ? { ...x, aktif: !r.aktif } : x));
  }

  async function sil(r: Reklam) {
    if (!confirm('Bu reklamı silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/reklam?id=${r.id}`, { method: 'DELETE' });
    if (res.ok) setReklamlar(prev => prev.filter(x => x.id !== r.id));
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-lg font-bold text-[#1a3a6b] mb-1">Reklam Yönetimi</h2>
      <p className="text-sm text-gray-500 mb-4">Kendi reklamlarınızı yükleyin. Bir alanda aktif özel reklam varsa, o alanda Google reklamı yerine sizinki gösterilir. Aynı alana birden fazla aktif reklam koyarsanız sırayla (dönüşümlü) gösterilir.</p>

      {mesaj && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${mesaj.tip === 'basari' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mesaj.metin}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Yeni Reklam Ekle</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Reklam Alanı</label>
            <select value={konum} onChange={e => setKonum(e.target.value as 'video' | 'sidebar' | 'popup' | 'anasayfa_ust')} className={inputCls}>
              <option value="video">Sayfa-içi video (sayfa gövdesi)</option>
              <option value="popup">Popup (detay sayfası açılınca)</option>
              <option value="sidebar">Kenar çubuğu (sağ menü)</option>
              <option value="anasayfa_ust">Ana sayfa üst şerit (arama kutusunun altı)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Kategori hedefi</label>
            <select value={kategori} onChange={e => setKategori(e.target.value)} className={inputCls}>
              <option value="">Genel (tüm kategoriler)</option>
              {kategoriler.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Bir kategori seçerseniz reklam yalnızca o kategorideki firmaların sayfa/popup&apos;unda görünür.</p>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Başlık (opsiyonel)</label>
            <input value={baslik} onChange={e => setBaslik(e.target.value)} placeholder="Örn. Ahmet Oto Yedek Parça" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Tıklanınca gidilecek bağlantı (opsiyonel)</label>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Başlangıç tarihi (opsiyonel)</label>
            <input type="date" value={baslangic} onChange={e => setBaslangic(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bitiş tarihi (opsiyonel)</label>
            <input type="date" value={bitis} onChange={e => setBitis(e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Görsel / Banner *</label>
            <input type="file" accept="image/gif,image/jpeg,image/png,image/webp" onChange={dosyaSec} className="text-sm" />
            {onizleme && <img src={onizleme} alt="önizleme" className="mt-2 max-h-32 rounded border border-gray-200" />}
            <p className="text-[11px] text-gray-400 mt-1">İpucu: Video alanı için geniş (örn. 970×250), kenar çubuğu için dikdörtgen (örn. 300×250) görsel kullanın.</p>
          </div>
        </div>
        <button onClick={ekle} disabled={kaydediliyor} className="mt-4 bg-[#1a3a6b] hover:bg-[#2554a0] disabled:bg-gray-400 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
          {kaydediliyor ? 'Ekleniyor...' : 'Reklam Ekle'}
        </button>
      </div>

      {yukleniyor ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-[#1a3a6b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reklamlar.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Henüz reklam eklenmemiş.</p>
      ) : (
        <div className="space-y-3">
          {reklamlar.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3 items-center">
              <img src={r.gorsel_url} alt={r.baslik} className="w-24 h-16 object-cover rounded border border-gray-200 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{r.konum === 'video' ? 'Sayfa-içi video' : r.konum === 'popup' ? 'Popup' : r.konum === 'anasayfa_ust' ? 'Ana sayfa üst şerit' : 'Kenar çubuğu'}</span>
                  {r.kategori && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">🏷️ {r.kategori}</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{r.aktif ? 'Aktif' : 'Pasif'}</span>
                  <span className="text-xs text-gray-400">👆 {r.tiklanma} tıklanma</span>
                </div>
                <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{r.baslik || '(başlıksız)'}</p>
                {r.link_url && <a href={r.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 truncate block">{r.link_url}</a>}
                {(r.baslangic_tarihi || r.bitis_tarihi) && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {r.baslangic_tarihi ? new Date(r.baslangic_tarihi).toLocaleDateString('tr-TR') : '—'} → {r.bitis_tarihi ? new Date(r.bitis_tarihi).toLocaleDateString('tr-TR') : '—'}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={() => aktifDegistir(r)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold">
                  {r.aktif ? 'Pasifleştir' : 'Aktifleştir'}
                </button>
                <button onClick={() => sil(r)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── İlan Yönetimi ───────────────────────────────────────────────────────────
const ILAN_KATEGORILER = ['Satılık', 'Kiralık', 'Hizmet', 'Parça / Yedek Parça', 'İş Arama', 'Diğer'];

function IlanYonetimi() {
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [ara, setAra] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliIlan, setSeciliIlan] = useState<Ilan | null>(null);
  const [duzenlemeAcik, setDuzenlemeAcik] = useState(false);
  const [duzenleForm, setDuzenleForm] = useState<Partial<Ilan>>({});
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [silOnayiAcik, setSilOnayiAcik] = useState(false);
  const [siliyor, setSiliyor] = useState(false);
  const [durum, setDurum] = useState<{ tip: 'basari' | 'hata'; mesaj: string } | null>(null);
  const [hizliIslem, setHizliIslem] = useState(false);

  useEffect(() => {
    // RLS anon key'e sadece onaylı ilanları gösteriyor; tüm ilanları
    // service-role kullanan admin endpoint'inden çekiyoruz.
    fetch('/api/admin/ilanlar')
      .then(res => res.ok ? res.json() : { ilanlar: [] })
      .then(data => { setIlanlar(data.ilanlar || []); setYukleniyor(false); })
      .catch(() => setYukleniyor(false));
  }, []);

  async function hizliDurumDegistir(id: number, yeniDurum: 'onaylandi' | 'reddedildi') {
    setHizliIslem(true);
    const res = await fetch('/api/admin/ilan-durum', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, durum: yeniDurum }),
    });
    if (res.ok) {
      const guncellenmis = { ...seciliIlan!, onay_durumu: yeniDurum };
      setSeciliIlan(guncellenmis);
      setIlanlar(prev => prev.map(i => i.id === id ? guncellenmis : i));
      setDurum({ tip: 'basari', mesaj: yeniDurum === 'onaylandi' ? 'İlan onaylandı ve ilan veren üyeler bölümüne eklendi.' : 'İlan reddedildi.' });
    } else {
      setDurum({ tip: 'hata', mesaj: 'İşlem başarısız.' });
    }
    setHizliIslem(false);
  }

  const filtrelenmis = ilanlar.filter(i =>
    i.baslik.toLowerCase().includes(ara.toLowerCase()) ||
    i.ilan_veren_ad.toLowerCase().includes(ara.toLowerCase()) ||
    i.kategori.toLowerCase().includes(ara.toLowerCase())
  );

  function ilanSec(ilan: Ilan) {
    setSeciliIlan(ilan);
    setDuzenlemeAcik(false);
    setDuzenleForm({});
    setSilOnayiAcik(false);
    setDurum(null);
  }

  function duzenlemeBaslat() {
    if (!seciliIlan) return;
    setDuzenleForm({
      baslik: seciliIlan.baslik,
      aciklama: seciliIlan.aciklama,
      kategori: seciliIlan.kategori,
      fiyat: seciliIlan.fiyat,
      telefon: seciliIlan.telefon,
      ilan_veren_ad: seciliIlan.ilan_veren_ad,
      onay_durumu: seciliIlan.onay_durumu,
    });
    setDuzenlemeAcik(true);
    setDurum(null);
  }

  async function ilanGuncelle() {
    if (!seciliIlan) return;
    setKaydediliyor(true);
    setDurum(null);
    const res = await fetch('/api/admin/ilan-guncelle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: seciliIlan.id, ...duzenleForm }),
    });
    if (res.ok) {
      // Sunucu alanları düzeltip kaydeder (ör. telefon biçimi); ekranda kaydedilen hâli gösterilir
      const { ilan: kaydedilen } = await res.json();
      const guncel = { ...seciliIlan, ...duzenleForm, ...kaydedilen } as Ilan;
      setSeciliIlan(guncel);
      setIlanlar(prev => prev.map(i => i.id === seciliIlan.id ? guncel : i));
      setDuzenlemeAcik(false);
      setDurum({ tip: 'basari', mesaj: 'İlan güncellendi.' });
    } else {
      const data = await res.json();
      setDurum({ tip: 'hata', mesaj: data.error || 'Güncelleme başarısız.' });
    }
    setKaydediliyor(false);
  }

  async function ilanSil() {
    if (!seciliIlan) return;
    setSiliyor(true);
    const res = await fetch('/api/admin/ilan-sil', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: seciliIlan.id }),
    });
    if (res.ok) {
      setIlanlar(prev => prev.filter(i => i.id !== seciliIlan.id));
      setSeciliIlan(null);
      setSilOnayiAcik(false);
    } else {
      const data = await res.json();
      setDurum({ tip: 'hata', mesaj: data.error || 'Silme başarısız.' });
      setSilOnayiAcik(false);
    }
    setSiliyor(false);
  }

  return (
    <div className="max-w-7xl mx-auto p-6 flex gap-6">
      <div className="w-80 flex-shrink-0">
        <input type="text" placeholder="İlan ara..." value={ara} onChange={e => setAra(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]" />
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[calc(100vh-220px)] overflow-y-auto">
          {yukleniyor ? (
            <div className="p-4 text-center text-gray-400 text-sm">Yükleniyor...</div>
          ) : filtrelenmis.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">Sonuç yok</div>
          ) : filtrelenmis.map(ilan => (
            <button key={ilan.id} onClick={() => ilanSec(ilan)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${seciliIlan?.id === ilan.id ? 'bg-blue-50 border-l-4 border-l-[#1a3a6b]' : ''}`}>
              <p className="font-medium text-sm text-gray-800 truncate">{ilan.baslik}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 truncate">{ilan.ilan_veren_ad}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${ilan.onay_durumu === 'onaylandi' ? 'bg-green-100 text-green-700' : ilan.onay_durumu === 'reddedildi' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {ilan.onay_durumu === 'onaylandi' ? 'Onaylı' : ilan.onay_durumu === 'reddedildi' ? 'Reddedildi' : 'Beklemede'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
        {!seciliIlan ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">👈</div>
            <p>Soldan bir ilan seçin</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg relative">
            {silOnayiAcik && (
              <div className="absolute inset-0 bg-white/95 z-10 flex items-center justify-center rounded-lg">
                <div className="text-center p-6">
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="font-bold text-gray-800 mb-1">İlanı silmek istediğinize emin misiniz?</p>
                  <p className="text-sm text-gray-500 mb-5"><strong>{seciliIlan.baslik}</strong> kalıcı olarak silinecek.</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={ilanSil} disabled={siliyor}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                      {siliyor ? 'Siliniyor...' : 'Evet, Sil'}
                    </button>
                    <button onClick={() => setSilOnayiAcik(false)}
                      className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold">
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border-b flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#1a3a6b] truncate">{seciliIlan.baslik}</h2>
                <p className="text-xs text-gray-500">{seciliIlan.kategori} · {seciliIlan.ilan_veren_ad}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!duzenlemeAcik ? (
                  <>
                    {seciliIlan.onay_durumu === 'beklemede' && (
                      <>
                        <button onClick={() => hizliDurumDegistir(seciliIlan.id, 'onaylandi')} disabled={hizliIslem}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                          {hizliIslem ? '...' : '✓ Onayla'}
                        </button>
                        <button onClick={() => hizliDurumDegistir(seciliIlan.id, 'reddedildi')} disabled={hizliIslem}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                          ✕ Reddet
                        </button>
                      </>
                    )}
                    <button onClick={duzenlemeBaslat}
                      className="px-3 py-1.5 bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-xs font-semibold rounded-lg transition-colors">
                      ✏️ Düzenle
                    </button>
                    <button onClick={() => setSilOnayiAcik(true)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors">
                      🗑️ Sil
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={ilanGuncelle} disabled={kaydediliyor}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                      {kaydediliyor ? 'Kaydediliyor...' : '✓ Kaydet'}
                    </button>
                    <button onClick={() => setDuzenlemeAcik(false)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors">
                      ✕ İptal
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {durum && (
                <div className={`px-4 py-2 rounded-lg text-sm ${durum.tip === 'basari' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {durum.mesaj}
                </div>
              )}
              {!duzenlemeAcik ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-gray-400 text-xs">İlan Başlığı</span><p className="text-gray-800 font-medium">{seciliIlan.baslik}</p></div>
                    <div><span className="text-gray-400 text-xs">Kategori</span><p className="text-gray-800">{seciliIlan.kategori}</p></div>
                    <div><span className="text-gray-400 text-xs">İlan Veren</span><p className="text-gray-800">{seciliIlan.ilan_veren_ad}</p></div>
                    <div><span className="text-gray-400 text-xs">E-posta</span><p className="text-gray-800">{seciliIlan.ilan_veren_email || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Telefon</span><p className="text-gray-800">{seciliIlan.telefon}</p></div>
                    <div><span className="text-gray-400 text-xs">Fiyat</span><p className="text-gray-800">{seciliIlan.fiyat || '—'}</p></div>
                    <div>
                      <span className="text-gray-400 text-xs">Durum</span>
                      <p className={`font-medium ${seciliIlan.onay_durumu === 'onaylandi' ? 'text-green-600' : seciliIlan.onay_durumu === 'reddedildi' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {seciliIlan.onay_durumu === 'onaylandi' ? '✓ Onaylı' : seciliIlan.onay_durumu === 'reddedildi' ? '✕ Reddedildi' : '⏳ Beklemede'}
                      </p>
                    </div>
                    <div><span className="text-gray-400 text-xs">Tarih</span><p className="text-gray-800">{new Date(seciliIlan.created_at).toLocaleString('tr-TR')}</p></div>
                  </div>
                  <div><span className="text-gray-400 text-xs">Açıklama</span><p className="text-gray-800 whitespace-pre-wrap mt-0.5">{seciliIlan.aciklama}</p></div>
                  {seciliIlan.fotograflar && seciliIlan.fotograflar.length > 0 && (
                    <div>
                      <span className="text-gray-400 text-xs">Fotoğraflar</span>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {seciliIlan.fotograflar.map((url, i) => (
                          <img key={i} src={url} alt={`Fotoğraf ${i + 1}`} className="w-24 h-20 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Başlık</label>
                    <input value={duzenleForm.baslik || ''} onChange={e => setDuzenleForm(f => ({ ...f, baslik: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Kategori</label>
                      <select value={duzenleForm.kategori || ''} onChange={e => setDuzenleForm(f => ({ ...f, kategori: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] bg-white">
                        {ILAN_KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Durum</label>
                      <select value={duzenleForm.onay_durumu || ''} onChange={e => setDuzenleForm(f => ({ ...f, onay_durumu: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] bg-white">
                        <option value="beklemede">Beklemede</option>
                        <option value="onaylandi">Onaylı</option>
                        <option value="reddedildi">Reddedildi</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">İlan Veren</label>
                      <input value={duzenleForm.ilan_veren_ad || ''} onChange={e => setDuzenleForm(f => ({ ...f, ilan_veren_ad: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Telefon</label>
                      <input value={duzenleForm.telefon || ''} onChange={e => setDuzenleForm(f => ({ ...f, telefon: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Fiyat</label>
                    <input value={duzenleForm.fiyat || ''} onChange={e => setDuzenleForm(f => ({ ...f, fiyat: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" placeholder="Ör: 5.000 TL, Pazarlıklı..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Açıklama</label>
                    <textarea value={duzenleForm.aciklama || ''} onChange={e => setDuzenleForm(f => ({ ...f, aciklama: e.target.value }))} rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] resize-none" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Üye Listesi ─────────────────────────────────────────────────────────────
function UyeListesi() {
  const [uyeler, setUyeler] = useState<Uye[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [ara, setAra] = useState('');
  const [silOnayiId, setSilOnayiId] = useState<string | null>(null);
  const [siliyor, setSiliyor] = useState(false);

  useEffect(() => {
    fetch('/api/admin/uyeler')
      .then(r => r.json())
      .then(({ uyeler: data }) => { setUyeler(data || []); setYukleniyor(false); });
  }, []);

  async function uyeSil(id: string) {
    setSiliyor(true);
    const res = await fetch('/api/admin/uyeler', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setUyeler(prev => prev.filter(u => u.id !== id));
    setSilOnayiId(null);
    setSiliyor(false);
  }

  const filtrelenmis = uyeler.filter(u =>
    u.ad.toLowerCase().includes(ara.toLowerCase()) ||
    u.email.toLowerCase().includes(ara.toLowerCase()) ||
    (u.telefon || '').includes(ara)
  );

  if (yukleniyor) return <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-700">
          Üye Listesi <span className="text-gray-400 font-normal text-sm">({uyeler.length} üye)</span>
        </h2>
        <input type="text" placeholder="Ad, e-posta veya telefon ara..." value={ara} onChange={e => setAra(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] w-72" />
      </div>
      {filtrelenmis.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">👤</div>
          <p>Üye bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ad Soyad</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">E-posta</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefon</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kayıt Tarihi</th>
                <th className="px-4 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrelenmis.map(uye => (
                <tr key={uye.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {uye.avatar_url ? (
                        <img src={uye.avatar_url} alt={uye.ad} className="w-7 h-7 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#1a3a6b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {uye.ad.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-800">{uye.ad}</span>
                        {uye.kaynak === 'ilan' && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">İlan ile</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{uye.email}</td>
                  <td className="px-4 py-3 text-gray-600">{uye.telefon || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(uye.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    {uye.kaynak === 'ilan' ? (
                      <span className="text-xs text-gray-400 italic">—</span>
                    ) : silOnayiId === uye.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => uyeSil(uye.id)} disabled={siliyor}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-semibold disabled:opacity-50">
                          {siliyor ? '...' : 'Sil'}
                        </button>
                        <button onClick={() => setSilOnayiId(null)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded">
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setSilOnayiId(uye.id)}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded font-medium">
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── İstatistikler ───────────────────────────────────────────────────────────
type GunlukDetayItem = { saat: string; id: number; bolge: string | null; ip: string | null; firmalar: { firma_ad: string; saat: string }[] };

type AnalyticsVeri = {
  gunluk: number;
  haftalik: number;
  aylik: number;
  yillik: number;
  gunlukDetay: GunlukDetayItem[];
  haftalikDetay: string[];
  aylikDetay: string[];
  topFirmalar: { firma_id: number; ad: string; sayi: number }[];
  kaynaklar: { kaynak: string; sayi: number }[];
  cihazlar: { cihaz: string; sayi: number }[];
  topSayfalar: { sayfa: string; sayi: number }[];
};

type DetayTip = 'gunluk' | 'haftalik' | 'aylik' | 'yillik' | null;

function Istatistikler() {
  const [veri, setVeri] = useState<AnalyticsVeri | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [acikDetay, setAcikDetay] = useState<DetayTip>(null);
  const [seciliZiyaret, setSeciliZiyaret] = useState<GunlukDetayItem | null>(null);
  const [konumDuzeltiliyor, setKonumDuzeltiliyor] = useState(false);
  const [konumSonuc, setKonumSonuc] = useState<string | null>(null);

  useEffect(() => { yukle(); }, []);

  async function yukle() {
    setYukleniyor(true);
    const res = await fetch('/api/admin/analytics');
    if (res.ok) setVeri(await res.json());
    setYukleniyor(false);
  }

  async function konumlarDuzelt() {
    setKonumDuzeltiliyor(true);
    setKonumSonuc(null);
    try {
      const res = await fetch('/api/admin/fix-locations', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setKonumSonuc(data.guncellenen > 0
          ? `${data.guncellenen} kayıt güncellendi.`
          : data.mesaj || 'Güncellenecek kayıt yok.');
        if (data.guncellenen > 0) yukle();
      } else {
        setKonumSonuc('Hata: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch {
      setKonumSonuc('Bağlantı hatası.');
    } finally {
      setKonumDuzeltiliyor(false);
    }
  }

  if (yukleniyor) return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-2 text-gray-400 text-sm"><span className="animate-spin">⟳</span> Yükleniyor...</div>
    </div>
  );
  if (!veri) return (
    <div className="max-w-7xl mx-auto p-6 text-red-500 text-sm">Veri alınamadı.</div>
  );

  const maxFirma = veri.topFirmalar[0]?.sayi || 1;
  const maxKaynak = veri.kaynaklar[0]?.sayi || 1;
  const toplamCihaz = (veri.cihazlar || []).reduce((t, c) => t + c.sayi, 0) || 1;

  const cihazIcon: Record<string, string> = {
    'Mobil': '📱', 'Tablet': '📟', 'Laptop': '💻', 'Masaüstü': '🖥️',
  };
  const cihazRenk: Record<string, string> = {
    'Mobil': '#2563eb', 'Tablet': '#16a34a', 'Laptop': '#9333ea', 'Masaüstü': '#ea580c',
  };

  const kartlar = [
    { tip: 'gunluk'  as DetayTip, baslik: 'Günlük Ziyaret',  sayi: veri.gunluk,   alt: 'Bugün (00:00\'dan beri)',   renk: '#1a3a6b' },
    { tip: 'haftalik'as DetayTip, baslik: 'Haftalık Ziyaret', sayi: veri.haftalik, alt: 'Bu hafta (Pazartesi\'den)',   renk: '#2554a0' },
    { tip: 'aylik'   as DetayTip, baslik: 'Aylık Ziyaret',   sayi: veri.aylik,    alt: 'Bu ay (1\'inden beri)',      renk: '#16a34a' },
    { tip: 'yillik'  as DetayTip, baslik: 'Yıllık Ziyaret',  sayi: veri.yillik,   alt: 'Bu yıl (1 Ocak\'tan beri)', renk: '#e8a020' },
  ];

  const haftalikAylikYillik: Record<string, string[]> = {
    haftalik: veri.haftalikDetay,
    aylik:    veri.aylikDetay,
    yillik:   [],
  };
  const detayBaslik: Record<string, string> = {
    gunluk:   'Günlük Ziyaretçi Saatleri',
    haftalik: 'Haftalık Ziyaretçi Günleri & Saatleri',
    aylik:    'Aylık Ziyaretçi Tarihleri',
    yillik:   'Yıllık Ziyaretçi Sayısı',
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1a3a6b]">Site İstatistikleri</h2>
        <div className="flex items-center gap-2">
          <button onClick={konumlarDuzelt} disabled={konumDuzeltiliyor} className="text-sm text-[#16a34a] border border-[#16a34a] px-3 py-1 rounded-lg hover:bg-[#16a34a] hover:text-white transition-colors disabled:opacity-50">
            {konumDuzeltiliyor ? '⟳ Düzeltiliyor...' : '📍 Konumları Düzelt'}
          </button>
          <button onClick={yukle} className="text-sm text-[#1a3a6b] border border-[#1a3a6b] px-3 py-1 rounded-lg hover:bg-[#1a3a6b] hover:text-white transition-colors">
            ↻ Yenile
          </button>
        </div>
      </div>
      {konumSonuc && (
        <div className="text-xs text-gray-500 text-right -mt-4">{konumSonuc}</div>
      )}

      {/* Ziyaretçi detay alt-popup (günlük kutucuğa tıklayınca) */}
      {seciliZiyaret && (
        <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-4" onClick={() => setSeciliZiyaret(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[260px] max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-[#1a3a6b] text-sm">Ziyaretçi Detayı</span>
              <button onClick={() => setSeciliZiyaret(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16">Saat</span>
                <span className="text-sm font-bold text-gray-800">{seciliZiyaret.saat}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16">Ziyaret ID</span>
                <span className="text-sm font-bold text-gray-800">#{seciliZiyaret.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16">IP Adresi</span>
                <span className="text-sm font-mono font-bold text-gray-800">{seciliZiyaret.ip || 'Bilinmiyor'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16">Konum</span>
                <span className="text-sm font-bold text-gray-800">{seciliZiyaret.bolge || 'Bilinmiyor'}</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400 block mb-2">Baktığı Firmalar</span>
                {seciliZiyaret.firmalar.length === 0 ? (
                  <span className="text-xs text-gray-400">Firma kartı görüntülenmemiş</span>
                ) : (
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {seciliZiyaret.firmalar.map((f, i) => (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-800 font-medium truncate">{f.firma_ad}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{f.saat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detay popup */}
      {acikDetay && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setAcikDetay(null); setSeciliZiyaret(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-[#1a3a6b] text-sm">{detayBaslik[acikDetay]}</h3>
              <button onClick={() => { setAcikDetay(null); setSeciliZiyaret(null); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1">
              {acikDetay === 'yillik' ? (
                <div className="text-center py-6">
                  <div className="text-5xl font-black text-[#e8a020]">{veri.yillik.toLocaleString('tr-TR')}</div>
                  <div className="text-sm text-gray-500 mt-2">ziyaretçi bu yıl</div>
                </div>
              ) : acikDetay === 'gunluk' ? (
                veri.gunlukDetay.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">Henüz veri yok.</p>
                ) : (
                  <>
                    <p className="text-[10px] text-gray-400 mb-2">Kutucuğa tıkla → ID & bölge görüntüle</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {veri.gunlukDetay.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => setSeciliZiyaret(item)}
                          className="bg-gray-50 rounded-lg px-2 py-1.5 text-center text-xs font-medium text-gray-700 border border-gray-100 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          {item.saat}
                        </button>
                      ))}
                    </div>
                  </>
                )
              ) : haftalikAylikYillik[acikDetay].length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Henüz veri yok.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {haftalikAylikYillik[acikDetay].map((zaman, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center text-xs font-medium text-gray-700 border border-gray-100">
                      {zaman}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
              {acikDetay === 'gunluk' && `Toplam: ${veri.gunlukDetay.length} ziyaret`}
              {acikDetay !== 'gunluk' && acikDetay !== 'yillik' && `Toplam: ${haftalikAylikYillik[acikDetay].length} ziyaret`}
            </div>
          </div>
        </div>
      )}

      {/* Ziyaret Sayıları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kartlar.map(kart => (
          <button
            key={kart.tip}
            onClick={() => setAcikDetay(acikDetay === kart.tip ? null : kart.tip)}
            className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1 text-left hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <span className="text-xs text-gray-500 font-medium">{kart.baslik}</span>
            <span className="text-3xl font-black" style={{ color: kart.renk }}>
              {kart.sayi.toLocaleString('tr-TR')}
            </span>
            <span className="text-xs text-gray-400">{kart.alt}</span>
            <span className="text-[10px] text-gray-300 mt-1">↑ detay için tıkla</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* En çok ziyaret edilen firmalar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4">
            En Çok Ziyaret Edilen Firmalar
            <span className="text-gray-400 font-normal ml-1">(son 30 gün)</span>
          </h3>
          {veri.topFirmalar.length === 0 ? (
            <p className="text-gray-400 text-sm">Henüz veri yok.</p>
          ) : (
            <div className="space-y-2">
              {veri.topFirmalar.map((f, i) => (
                <div key={f.firma_id} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 text-xs w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                    <div
                      className="h-full rounded-full absolute left-0 transition-all"
                      style={{ width: `${Math.max((f.sayi / maxFirma) * 100, 6)}%`, backgroundColor: '#1a3a6b' }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold text-white truncate">
                      {f.ad}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-8 text-right flex-shrink-0">{f.sayi}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ziyaretçi kaynakları */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4">
            Ziyaretçi Kaynakları
            <span className="text-gray-400 font-normal ml-1">(son 30 gün, nereden gelinmiş)</span>
          </h3>
          {veri.kaynaklar.length === 0 ? (
            <p className="text-gray-400 text-sm">Henüz veri yok.</p>
          ) : (
            <div className="space-y-2">
              {veri.kaynaklar.map((k, i) => (
                <div key={k.kaynak} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 text-xs w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                    <div
                      className="h-full rounded-full absolute left-0 transition-all"
                      style={{ width: `${Math.max((k.sayi / maxKaynak) * 100, 6)}%`, backgroundColor: '#e8a020' }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold text-white truncate">
                      {k.kaynak}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-8 text-right flex-shrink-0">{k.sayi}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cihaz Türleri */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4">
          Cihaz Türleri
          <span className="text-gray-400 font-normal ml-1">(son 30 gün, hangi cihazla girilmiş)</span>
        </h3>
        {!veri.cihazlar || veri.cihazlar.length === 0 ? (
          <p className="text-gray-400 text-sm">Henüz veri yok.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {veri.cihazlar.map(c => {
              const yuzde = Math.round((c.sayi / toplamCihaz) * 100);
              return (
                <div key={c.cihaz} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <span className="text-2xl">{cihazIcon[c.cihaz] || '💻'}</span>
                  <span className="text-xs font-semibold text-gray-600">{c.cihaz}</span>
                  <span className="text-xl font-black" style={{ color: cihazRenk[c.cihaz] || '#1a3a6b' }}>
                    {yuzde}%
                  </span>
                  <span className="text-[10px] text-gray-400">{c.sayi} ziyaret</span>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${yuzde}%`, backgroundColor: cihazRenk[c.cihaz] || '#1a3a6b' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* En Çok Ziyaret Edilen Sayfalar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4">
          En Çok Gezilen Bölümler
          <span className="text-gray-400 font-normal ml-1">(son 30 gün, site içi gezinti)</span>
        </h3>
        {!veri.topSayfalar || veri.topSayfalar.length === 0 ? (
          <p className="text-gray-400 text-sm">Henüz veri yok.</p>
        ) : (
          <div className="space-y-2">
            {veri.topSayfalar.map((s, i) => {
              const maxSayfa = veri.topSayfalar[0]?.sayi || 1;
              return (
                <div key={s.sayfa} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 text-xs w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                    <div
                      className="h-full rounded-full absolute left-0 transition-all"
                      style={{ width: `${Math.max((s.sayi / maxSayfa) * 100, 6)}%`, backgroundColor: '#16a34a' }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold text-white truncate">
                      {s.sayfa}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-8 text-right flex-shrink-0">{s.sayi}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin: Firma Yorum Yönetimi ─────────────────────────────────────────────
// Yönetici yorum ekleyemez/düzenleyemez; sadece gizleyebilir (sitede görünmez, puana katılmaz) veya silebilir.
type AdminYorumTip = {
  id: number; kullanici_ad: string; kullanici_email: string; yorum: string; puan: number;
  created_at: string; guncelleme_tarihi: string | null; gizli: boolean;
  cevap: string | null; cevap_tarihi: string | null; cevap_guncelleme_tarihi: string | null; cevap_gizli: boolean;
};
type AdminOzet = { yorum_sayisi: number; ortalama_puan: number | null; olumlu_yuzde: number | null };

function AdminYildizlar({ puan }: { puan: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= puan ? 'text-yellow-400' : 'text-gray-300'}>
          {i <= puan ? '⭐' : '☆'}
        </span>
      ))}
    </span>
  );
}

function AdminFirmaYorumlari({ firmaId }: { firmaId: number }) {
  const [yorumlar, setYorumlar] = useState<AdminYorumTip[]>([]);
  const [ozet, setOzet] = useState<AdminOzet | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemId, setIslemId] = useState<number | null>(null);
  const [silId, setSilId] = useState<number | null>(null);
  const [mesaj, setMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null);

  const fetchYorumlar = useCallback(async () => {
    setYukleniyor(true);
    const res = await fetch(`/api/admin/yorumlar?firmaId=${firmaId}`);
    const data = await res.json();
    if (res.ok) {
      setYorumlar(data.yorumlar || []);
      setOzet(data.ozet);
    } else {
      setMesaj({ tip: 'hata', metin: data.error || 'Yorumlar yüklenemedi.' });
    }
    setYukleniyor(false);
  }, [firmaId]);

  useEffect(() => { fetchYorumlar(); }, [fetchYorumlar]);

  async function gizliDegistir(y: AdminYorumTip) {
    setIslemId(y.id);
    setMesaj(null);
    const res = await fetch('/api/admin/yorum-gizle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: y.id, gizli: !y.gizli }),
    });
    const data = await res.json();
    if (res.ok) {
      setMesaj({ tip: 'basari', metin: y.gizli ? 'Yorum tekrar görünür.' : 'Yorum gizlendi; sitede görünmüyor ve puana katılmıyor.' });
      fetchYorumlar();
    } else {
      setMesaj({ tip: 'hata', metin: data.error || 'İşlem başarısız.' });
    }
    setIslemId(null);
  }

  async function cevapGizliDegistir(y: AdminYorumTip) {
    setIslemId(y.id);
    setMesaj(null);
    const res = await fetch('/api/admin/yorum-cevap-gizle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: y.id, gizli: !y.cevap_gizli }),
    });
    const data = await res.json();
    if (res.ok) {
      setMesaj({ tip: 'basari', metin: y.cevap_gizli ? 'Firma yanıtı tekrar görünür.' : 'Firma yanıtı gizlendi; sitede görünmüyor.' });
      fetchYorumlar();
    } else {
      setMesaj({ tip: 'hata', metin: data.error || 'İşlem başarısız.' });
    }
    setIslemId(null);
  }

  async function yorumSil(id: number) {
    setIslemId(id);
    const res = await fetch('/api/admin/yorum-sil', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      setMesaj({ tip: 'basari', metin: 'Yorum silindi.' });
      fetchYorumlar();
    } else {
      setMesaj({ tip: 'hata', metin: data.error || 'Silme başarısız.' });
    }
    setSilId(null);
    setIslemId(null);
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Başlık */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
        <span className="font-semibold text-gray-700 text-sm">⭐ Değerlendirmeler</span>
        {ozet && ozet.yorum_sayisi > 0 && (
          <span className="text-xs text-gray-400">
            {ozet.yorum_sayisi} görünür yorum · %{ozet.olumlu_yuzde ?? 0} olumlu · ort. {ozet.ortalama_puan}
          </span>
        )}
      </div>

      {mesaj && (
        <div className={`px-4 py-2 text-xs ${mesaj.tip === 'basari' ? 'bg-green-50 text-green-700 border-b border-green-100' : 'bg-red-50 text-red-700 border-b border-red-100'}`}>
          {mesaj.metin}
        </div>
      )}

      {/* Liste */}
      <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
        {yukleniyor ? (
          <div className="p-4 text-center text-xs text-gray-400">Yükleniyor...</div>
        ) : yorumlar.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">Henüz değerlendirme yok.</div>
        ) : (
          yorumlar.map((y) => (
            <div key={y.id} className={`px-4 py-3 ${y.gizli ? 'bg-gray-50' : ''}`}>
              {silId === y.id ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-600 flex-1">Bu yorum kalıcı olarak silinsin mi?</span>
                  <button
                    onClick={() => yorumSil(y.id)}
                    disabled={islemId === y.id}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-semibold disabled:opacity-50"
                  >
                    {islemId === y.id ? '...' : 'Evet, Sil'}
                  </button>
                  <button
                    onClick={() => setSilId(null)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex-1 min-w-0 ${y.gizli ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-gray-700">{y.kullanici_ad}</span>
                      <AdminYildizlar puan={y.puan} />
                      <span className="text-xs text-gray-400">{new Date(y.created_at).toLocaleDateString('tr-TR')}</span>
                      {y.guncelleme_tarihi && <span className="text-[10px] text-gray-400">(düzenlendi)</span>}
                      {y.gizli && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-semibold">Gizli</span>}
                    </div>
                    <p className="text-[11px] text-gray-400 break-all">{y.kullanici_email}</p>
                    {y.yorum && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{y.yorum}</p>}
                    {y.cevap && (
                      <div className={`mt-1.5 border-l-2 pl-2 ${y.cevap_gizli ? 'border-gray-300 opacity-60' : 'border-[#1a3a6b]'}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-[#1a3a6b]">💬 Firma yanıtı</span>
                          {y.cevap_gizli && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-semibold">Gizli</span>}
                          <button onClick={() => cevapGizliDegistir(y)} disabled={islemId === y.id}
                            className="text-[11px] text-gray-500 hover:text-gray-800 underline disabled:opacity-50">
                            {y.cevap_gizli ? 'Yanıtı göster' : 'Yanıtı gizle'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{y.cevap}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => gizliDegistir(y)}
                      disabled={islemId === y.id}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors disabled:opacity-50"
                    >
                      {islemId === y.id ? '...' : y.gizli ? '👁 Göster' : '🙈 Gizle'}
                    </button>
                    <button
                      onClick={() => { setSilId(y.id); setMesaj(null); }}
                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded transition-colors"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Admin Panel ─────────────────────────────────────────────────────────────
function AdminPanel() {
  const [aktifSekme, setAktifSekme] = useState<'bekleyen' | 'ilanlar' | 'firmalar' | 'ilan-yonetimi' | 'uyeler' | 'istatistikler' | 'guncelleme-talepleri' | 'site-kullanimi' | 'reklamlar' | 'sanayi-siteleri' | 'kategoriler' | 'firma-ekle' | 'yeni-yorumlar' | 'sikayetler'>('bekleyen');
  const [bekleyenSayi, setBekleyenSayi] = useState(0);
  const [bekleyenIlanSayi, setBekleyenIlanSayi] = useState(0);
  const [bekleyenGuncellemeSayi, setBekleyenGuncellemeSayi] = useState(0);
  const [yeniYorumSayi, setYeniYorumSayi] = useState(0);
  const [bekleyenSikayetSayi, setBekleyenSikayetSayi] = useState(0);
  const [toplamFirmaSayisi, setToplamFirmaSayisi] = useState(0);
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [ara, setAra] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliFirma, setSeciliFirma] = useState<Firma | null>(null);
  const [fotograf, setFotograf] = useState<File | null>(null);
  const [onizleme, setOnizleme] = useState<string | null>(null);
  const [durum, setDurum] = useState<{ tip: 'basari' | 'hata'; mesaj: string } | null>(null);
  const [yukleniyorFoto, setYukleniyorFoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Düzenleme
  const [duzenlemeAcik, setDuzenlemeAcik] = useState(false);
  const [duzenleForm, setDuzenleForm] = useState<Partial<Firma>>({});
  const [kaydediliyor, setKaydediliyor] = useState(false);
  // Silme ve yayından kaldırma
  const [silOnayiAcik, setSilOnayiAcik] = useState(false);
  const [yayinIslem, setYayinIslem] = useState(false);
  // Detay fotoğraf
  const detayFotoRef = useRef<HTMLInputElement>(null);
  const [detayFotoYukleniyor, setDetayFotoYukleniyor] = useState(false);

  useEffect(() => {
    supabase.from('firmalar').select('*', { count: 'exact', head: true }).eq('onay_durumu', 'beklemede')
      .then(({ count }) => setBekleyenSayi(count || 0));
    supabase.from('firmalar').select('*', { count: 'exact', head: true }).not('bekleyen_degisiklikler', 'is', null)
      .then(({ count }) => setBekleyenGuncellemeSayi(count || 0));
    // Panel içi bildirim: görülmemiş yeni yorumlar ve bekleyen şikâyetler
    fetch('/api/bildirimler?kapsam=yonetici')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setYeniYorumSayi(d.sayi); setBekleyenSikayetSayi(d.bekleyenSikayet ?? 0); setBekleyenIlanSayi(d.bekleyenIlan ?? 0); } })
      .catch(() => {});

    // Gerçek toplam firma sayısını çek
    function sayiYukle() {
      supabase.from('firmalar').select('*', { count: 'exact', head: true })
        .then(({ count }) => setToplamFirmaSayisi(count || 0));
    }
    sayiYukle();

    // Firma eklenince / silinince sayıyı otomatik güncelle
    const channel = supabase
      .channel('admin-firma-sayac')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'firmalar' }, sayiYukle)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    async function getir() {
      setYukleniyor(true);
      const tumFirmalar: Firma[] = [];
      const CHUNK = 1000;
      let from = 0;
      while (true) {
        const { data } = await supabase.from('firmalar').select('*').order('ad').range(from, from + CHUNK - 1);
        if (!data || data.length === 0) break;
        tumFirmalar.push(...data);
        if (data.length < CHUNK) break;
        from += CHUNK;
      }
      setFirmalar(tumFirmalar);
      setYukleniyor(false);
    }
    getir();
  }, []);

  const filtrelenmiş = firmalar.filter(f => {
    const q = ara.toLowerCase();
    return (
      f.ad?.toLowerCase().includes(q) ||
      f.sektor?.toLowerCase().includes(q) ||
      f.sahip?.toLowerCase().includes(q) ||
      f.sanayi_sitesi?.toLowerCase().includes(q) ||
      f.telefon?.toLowerCase().includes(q)
    );
  });

  const [benzersizSektorler, setBenzersizSektorler] = useState<string[]>([]);
  const [benzersizSanayiSiteleri, setBenzersizSanayiSiteleri] = useState<string[]>([]);

  useEffect(() => {
    async function tumBenzersizleriGetir(alan: 'sektor' | 'sanayi_sitesi', setFn: (v: string[]) => void) {
      const degerler: string[] = [];
      const CHUNK = 1000;
      let from = 0;
      while (true) {
        const { data } = await supabase.from('firmalar').select(alan).range(from, from + CHUNK - 1);
        if (!data || data.length === 0) break;
        data.forEach((row: Record<string, string>) => { if (row[alan]) degerler.push(row[alan]); });
        if (data.length < CHUNK) break;
        from += CHUNK;
      }
      setFn(Array.from(new Set(degerler)).sort());
    }
    // Sektör seçenekleri Kategori Yönetimi'ndeki aktif kategorilerden
    aktifKategoriler(supabase).then(k =>
      setBenzersizSektorler(Array.from(new Set(k.map(x => x.ad))).sort((a, b) => a.localeCompare(b, 'tr')))
    );
    tumBenzersizleriGetir('sanayi_sitesi', setBenzersizSanayiSiteleri);
  }, []);

  function firmaSeç(firma: Firma) {
    setSeciliFirma(firma);
    setFotograf(null);
    setOnizleme(firma.fotograf_url || null);
    setDurum(null);
    setDuzenlemeAcik(false);
    setDuzenleForm({});
    setSilOnayiAcik(false);
  }

  function duzenlemeBaslat() {
    if (!seciliFirma) return;
    setDuzenleForm({
      ad: seciliFirma.ad,
      sahip: seciliFirma.sahip,
      sektor: seciliFirma.sektor,
      sanayi_sitesi: seciliFirma.sanayi_sitesi,
      telefon: seciliFirma.telefon,
      mobil_telefon: seciliFirma.mobil_telefon ?? '',
      whatsapp: seciliFirma.whatsapp ?? '',
      adres: seciliFirma.adres,
      plus_code: seciliFirma.plus_code ?? '',
      web_sitesi: seciliFirma.web_sitesi,
      eposta: seciliFirma.eposta ?? '',
      instagram: seciliFirma.instagram ?? '',
      facebook: seciliFirma.facebook ?? '',
      tiktok: seciliFirma.tiktok ?? '',
      nsosyal: seciliFirma.nsosyal ?? '',
      hizmetler: seciliFirma.hizmetler,
      ozel_firma: seciliFirma.ozel_firma,
      ozel_baslangic: seciliFirma.ozel_baslangic ?? null,
      ozel_bitis: seciliFirma.ozel_bitis ?? null,
      onay_durumu: seciliFirma.onay_durumu,
      hedef_sayfa: seciliFirma.hedef_sayfa ?? null,
      kullanici_email: seciliFirma.kullanici_email ?? '',
      firma_tipi: seciliFirma.firma_tipi ?? null,
    });
    setDuzenlemeAcik(true);
    setDurum(null);
  }

  async function firmaGuncelle() {
    if (!seciliFirma) return;
    setKaydediliyor(true);
    setDurum(null);
    const hizmetler = typeof duzenleForm.hizmetler === 'string'
      ? (duzenleForm.hizmetler as unknown as string).split(',').map((h: string) => h.trim()).filter(Boolean)
      : duzenleForm.hizmetler;
    const res = await fetch('/api/admin/firma-guncelle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: seciliFirma.id, ...duzenleForm, hizmetler }),
    });
    if (res.ok) {
      const guncel = { ...seciliFirma, ...duzenleForm, hizmetler: hizmetler || [] };
      setSeciliFirma(guncel as Firma);
      setFirmalar(prev => prev.map(f => f.id === seciliFirma.id ? guncel as Firma : f));
      setDuzenlemeAcik(false);
      setDurum({ tip: 'basari', mesaj: 'Firma bilgileri güncellendi.' });
    } else {
      const data = await res.json();
      setDurum({ tip: 'hata', mesaj: data.error || 'Güncelleme başarısız.' });
    }
    setKaydediliyor(false);
  }

  function firmaSilindi(fotografHatasi: boolean) {
    if (!seciliFirma) return;
    setFirmalar(prev => prev.filter(f => f.id !== seciliFirma.id));
    setSeciliFirma(null);
    setSilOnayiAcik(false);
    if (fotografHatasi) alert('Firma silindi, ancak bazı fotoğraflar depodan silinemedi.');
  }

  // Yayından kaldır (pasif) veya yayına geri al (onaylandi); firma kaydı silinmez
  async function yayinDurumuDegistir(durum: 'pasif' | 'onaylandi') {
    if (!seciliFirma) return;
    setYayinIslem(true);
    setDurum(null);
    try {
      const res = await fetch('/api/admin/firma-durum', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seciliFirma.id, durum }),
      });
      const data = await res.json();
      if (res.ok) {
        const guncel = { ...seciliFirma, onay_durumu: durum };
        setSeciliFirma(guncel);
        setFirmalar(prev => prev.map(f => f.id === guncel.id ? guncel : f));
        setDurum({ tip: 'basari', mesaj: durum === 'pasif' ? 'Firma yayından kaldırıldı. Sitede görünmüyor; "Yayına geri al" ile geri getirebilirsiniz.' : 'Firma yeniden yayında.' });
      } else {
        setDurum({ tip: 'hata', mesaj: data.error || 'İşlem başarısız.' });
      }
    } catch {
      setDurum({ tip: 'hata', mesaj: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
    }
    setYayinIslem(false);
  }

  async function revalidateFirma(id: number) {
    await fetch('/api/admin/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firmaId: id }),
    });
  }

  async function detayFotoEkle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !seciliFirma) return;
    const mevcutlar = seciliFirma.detay_fotograflar || [];
    if (mevcutlar.length >= 5) return;
    setDetayFotoYukleniyor(true);
    setDurum(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('firma_id', String(seciliFirma.id));
    fd.append('tip', 'detay');
    const res = await fetch('/api/admin/foto-yukle', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      setDurum({ tip: 'hata', mesaj: data.error || 'Yüklenemedi.' });
    } else {
      const yeniDetaylar = [...mevcutlar, data.url];
      const guncel = { ...seciliFirma, detay_fotograflar: yeniDetaylar };
      setSeciliFirma(guncel);
      setFirmalar(prev => prev.map(f => f.id === seciliFirma.id ? guncel : f));
      setDurum({ tip: 'basari', mesaj: 'Detay fotoğrafı eklendi.' });
      revalidateFirma(seciliFirma.id);
    }
    setDetayFotoYukleniyor(false);
    if (detayFotoRef.current) detayFotoRef.current.value = '';
  }

  async function detayFotoSil(url: string) {
    if (!seciliFirma) return;
    setDetayFotoYukleniyor(true);
    setDurum(null);
    const res = await fetch('/api/admin/foto-sil', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, firma_id: seciliFirma.id, tip: 'detay' }),
    });
    if (res.ok) {
      const yeniDetaylar = (seciliFirma.detay_fotograflar || []).filter(u => u !== url);
      const guncel = { ...seciliFirma, detay_fotograflar: yeniDetaylar };
      setSeciliFirma(guncel);
      setFirmalar(prev => prev.map(f => f.id === seciliFirma.id ? guncel : f));
      setDurum({ tip: 'basari', mesaj: 'Detay fotoğrafı silindi.' });
      revalidateFirma(seciliFirma.id);
    } else {
      const data = await res.json();
      setDurum({ tip: 'hata', mesaj: data.error || 'Silinemedi.' });
    }
    setDetayFotoYukleniyor(false);
  }

  function dosyaSeç(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotograf(file);
    setOnizleme(URL.createObjectURL(file));
  }

  async function fotografYükle() {
    if (!seciliFirma || !fotograf) return;
    setYukleniyorFoto(true);
    setDurum(null);
    const fd = new FormData();
    fd.append('file', fotograf);
    fd.append('firma_id', String(seciliFirma.id));
    fd.append('tip', 'kart');
    const res = await fetch('/api/admin/foto-yukle', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      setDurum({ tip: 'hata', mesaj: data.error || 'Fotoğraf yüklenemedi.' });
    } else {
      setDurum({ tip: 'basari', mesaj: 'Fotoğraf başarıyla yüklendi!' });
      const güncel = { ...seciliFirma, fotograf_url: data.url };
      setSeciliFirma(güncel);
      setFirmalar(prev => prev.map(f => f.id === seciliFirma.id ? güncel : f));
      setFotograf(null);
      revalidateFirma(seciliFirma.id);
    }
    setYukleniyorFoto(false);
  }

  async function fotografSil() {
    if (!seciliFirma?.fotograf_url) return;
    setYukleniyorFoto(true);
    const res = await fetch('/api/admin/foto-sil', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: seciliFirma.fotograf_url, firma_id: seciliFirma.id, tip: 'kart' }),
    });
    if (res.ok) {
      const güncel = { ...seciliFirma, fotograf_url: null };
      setSeciliFirma(güncel);
      setFirmalar(prev => prev.map(f => f.id === seciliFirma.id ? güncel : f));
      setOnizleme(null);
      setDurum({ tip: 'basari', mesaj: 'Fotoğraf silindi.' });
      revalidateFirma(seciliFirma.id);
    } else {
      const data = await res.json();
      setDurum({ tip: 'hata', mesaj: data.error || 'Silinemedi.' });
    }
    setYukleniyorFoto(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a3a6b] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Admin Paneli</h1>
          <p className="text-blue-200 text-sm">{toplamFirmaSayisi} firma</p>
        </div>
        <div className="text-sm text-green-300">
          <ActiveUsers />
        </div>
      </div>

      {/* Sekmeler */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setAktifSekme('bekleyen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'bekleyen' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Firma Onayları
            {bekleyenSayi > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{bekleyenSayi}</span>
            )}
          </button>
          <button onClick={() => setAktifSekme('ilanlar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'ilanlar' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            İlan Onayları
            {bekleyenIlanSayi > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{bekleyenIlanSayi}</span>
            )}
          </button>
          <button onClick={() => setAktifSekme('firmalar')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'firmalar' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Firma Yönetimi
          </button>
          <button onClick={() => setAktifSekme('firma-ekle')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'firma-ekle' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            ➕ Firma Ekle
          </button>
          <button onClick={() => setAktifSekme('ilan-yonetimi')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'ilan-yonetimi' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            İlan Yönetimi
          </button>
          <button onClick={() => setAktifSekme('uyeler')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'uyeler' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Üyeler
          </button>
          <button onClick={() => setAktifSekme('guncelleme-talepleri')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'guncelleme-talepleri' ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            ✏️ Güncelleme Talepleri
            {bekleyenGuncellemeSayi > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{bekleyenGuncellemeSayi}</span>
            )}
          </button>
          <button onClick={() => setAktifSekme('yeni-yorumlar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'yeni-yorumlar' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            🔔 Yeni Yorumlar
            {yeniYorumSayi > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{yeniYorumSayi}</span>
            )}
          </button>
          <button onClick={() => setAktifSekme('sikayetler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'sikayetler' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            🚩 Şikâyetler
            {bekleyenSikayetSayi > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{bekleyenSikayetSayi}</span>
            )}
          </button>
          <button onClick={() => setAktifSekme('istatistikler')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'istatistikler' ? 'bg-[#e8a020] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            📊 İstatistikler
          </button>
          <button onClick={() => setAktifSekme('site-kullanimi')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'site-kullanimi' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            📄 Site Kullanımı
          </button>
          <button onClick={() => setAktifSekme('reklamlar')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'reklamlar' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            📢 Reklamlar
          </button>
          <button onClick={() => setAktifSekme('sanayi-siteleri')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'sanayi-siteleri' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            🏭 Sanayi Siteleri
          </button>
          <button onClick={() => setAktifSekme('kategoriler')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aktifSekme === 'kategoriler' ? 'bg-[#1a3a6b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            📂 Kategoriler
          </button>
        </div>
      </div>

      {aktifSekme === 'sanayi-siteleri' && (
        <div className="max-w-7xl mx-auto p-6">
          <SanayiSiteleriYonetimi />
        </div>
      )}

      {aktifSekme === 'firma-ekle' && (
        <div className="max-w-7xl mx-auto p-6">
          <FirmaEkleFormu yonetici />
        </div>
      )}

      {aktifSekme === 'yeni-yorumlar' && <AdminYeniYorumlar onSayi={setYeniYorumSayi} />}
      {aktifSekme === 'sikayetler' && <AdminSikayetler onSayi={setBekleyenSikayetSayi} />}

      {aktifSekme === 'kategoriler' && (
        <div className="max-w-7xl mx-auto p-6">
          <KategoriYonetimi />
        </div>
      )}

      {aktifSekme === 'guncelleme-talepleri' && (
        <div className="max-w-7xl mx-auto p-6">
          <BekleyenGuncellemeler onSayi={setBekleyenGuncellemeSayi} />
        </div>
      )}

      {aktifSekme === 'bekleyen' && (
        <div className="max-w-7xl mx-auto p-6">
          <BekleyenFirmalar />
        </div>
      )}

      {aktifSekme === 'ilanlar' && (
        <div className="max-w-7xl mx-auto p-6">
          <BekleyenIlanlar />
        </div>
      )}

      {aktifSekme === 'firmalar' && (
      <div className="max-w-7xl mx-auto p-6 flex gap-6">
        <div className="w-80 flex-shrink-0">
          <input type="text" placeholder="Firma ara..." value={ara} onChange={e => setAra(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]" />
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[calc(100vh-220px)] overflow-y-auto">
            {yukleniyor ? (
              <div className="p-4 text-center text-gray-400 text-sm">Yükleniyor...</div>
            ) : filtrelenmiş.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">Sonuç yok</div>
            ) : filtrelenmiş.map(firma => (
              <button key={firma.id} onClick={() => firmaSeç(firma)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors flex items-center gap-2 ${seciliFirma?.id === firma.id ? 'bg-blue-50 border-l-4 border-l-[#1a3a6b]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{firma.ad}</p>
                  <p className="text-xs text-gray-400 truncate">{firma.sektor}</p>
                </div>
                {firma.onay_durumu === 'pasif' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">Yayında değil</span>}
                {ozelDurum(firma).durum === 'aktif' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 flex-shrink-0">💎 {new Date(firma.ozel_bitis!).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</span>
                )}
                {firma.fotograf_url && <span className="text-green-500 text-xs flex-shrink-0">📷</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {!seciliFirma ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400">
              <div className="text-5xl mb-3">👈</div>
              <p>Soldan bir firma seçin</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg relative">
              {silOnayiAcik && (
                <FirmaSilPenceresi
                  firmaId={seciliFirma.id}
                  firmaAdi={seciliFirma.ad}
                  adres="/api/admin/firma-sil"
                  onSilindi={firmaSilindi}
                  onKapat={() => setSilOnayiAcik(false)}
                />
              )}

              {/* Header */}
              <div className="p-4 border-b flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#1a3a6b] truncate">{seciliFirma.ad}</h2>
                  <p className="text-xs text-gray-500">{seciliFirma.sektor} · {seciliFirma.sanayi_sitesi}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!duzenlemeAcik ? (
                    <>
                      <button onClick={duzenlemeBaslat}
                        className="px-3 py-1.5 bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-xs font-semibold rounded-lg transition-colors">
                        ✏️ Düzenle
                      </button>
                      {seciliFirma.onay_durumu === 'pasif' ? (
                        <button onClick={() => yayinDurumuDegistir('onaylandi')} disabled={yayinIslem}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                          {yayinIslem ? '...' : '↩ Yayına geri al'}
                        </button>
                      ) : seciliFirma.onay_durumu === 'onaylandi' && (
                        <button onClick={() => yayinDurumuDegistir('pasif')} disabled={yayinIslem}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                          {yayinIslem ? '...' : '⏸ Yayından kaldır'}
                        </button>
                      )}
                      <button onClick={() => setSilOnayiAcik(true)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors">
                        🗑️ Kalıcı sil
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={firmaGuncelle} disabled={kaydediliyor}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                        {kaydediliyor ? 'Kaydediliyor...' : '✓ Kaydet'}
                      </button>
                      <button onClick={() => setDuzenlemeAcik(false)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors">
                        ✕ İptal
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Durum mesajı */}
                {durum && (
                  <div className={`px-4 py-2 rounded-lg text-sm ${durum.tip === 'basari' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {durum.mesaj}
                  </div>
                )}

                {/* Firma bilgileri: görüntü veya düzenleme formu */}
                {!duzenlemeAcik ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400 text-xs">Firma Adı</span><p className="text-gray-800 font-medium">{seciliFirma.ad || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Sahip</span><p className="text-gray-800">{seciliFirma.sahip || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Sektör</span><p className="text-gray-800">{seciliFirma.sektor || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Sanayi Sitesi</span><p className="text-gray-800">{seciliFirma.sanayi_sitesi || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Telefon</span><p className="text-gray-800">{seciliFirma.telefon || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Mobil Telefon</span><p className="text-gray-800">{seciliFirma.mobil_telefon || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">WhatsApp</span><p className="text-gray-800 break-all">{seciliFirma.whatsapp || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Durum</span>
                      <p className={`font-medium ${seciliFirma.onay_durumu === 'onaylandi' ? 'text-green-600' : seciliFirma.onay_durumu === 'reddedildi' ? 'text-red-600' : seciliFirma.onay_durumu === 'pasif' ? 'text-gray-500' : 'text-yellow-600'}`}>
                        {seciliFirma.onay_durumu === 'onaylandi' ? '✓ Onaylı' : seciliFirma.onay_durumu === 'reddedildi' ? '✕ Reddedildi' : seciliFirma.onay_durumu === 'pasif' ? '⏸ Yayından kaldırıldı' : '⏳ Beklemede'}
                      </p>
                    </div>
                    <div className="col-span-2"><span className="text-gray-400 text-xs">Adres</span><p className="text-gray-800">{seciliFirma.adres || '—'}</p></div>
                    <div className="col-span-2"><span className="text-gray-400 text-xs">📍 Plus Code</span><p className="text-gray-800">{seciliFirma.plus_code || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Firma Tipi</span>
                      <p className="text-gray-800">
                        {seciliFirma.firma_tipi === 'kurumsal' ? '🏢 Kurumsal' : seciliFirma.firma_tipi === 'sitesiz' ? '🏪 Sanayi Dışı' : seciliFirma.firma_tipi === 'siteli' ? '🏗️ Sanayi Sitesi' : '—'}
                      </p>
                    </div>
                    {seciliFirma.hizmetler?.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-400 text-xs">Hizmetler</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {seciliFirma.hizmetler.map((h, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{h}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-gray-400 text-xs">Sahip E-posta (kullanici_email)</span>
                      <p className={`text-sm font-medium ${seciliFirma.kullanici_email ? 'text-gray-800' : 'text-red-400 italic'}`}>
                        {seciliFirma.kullanici_email || '— Atanmamış (düzenle butonundan ekleyebilirsiniz)'}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                      {ozelDurum(seciliFirma).durum !== 'yok' && (
                        <span className={`px-2 py-0.5 rounded-full font-medium ${ozelDurum(seciliFirma).durum === 'aktif' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                          {ozelDurumYazisi(ozelDurum(seciliFirma), seciliFirma.ozel_bitis)}
                        </span>
                      )}
                      {musteriFavorisiMi(seciliFirma) && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">⭐ Müşteri Favorisi</span>}
                      {(seciliFirma as Firma & { hedef_sayfa?: number | null }).hedef_sayfa && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          📌 Sayfa {(seciliFirma as Firma & { hedef_sayfa?: number | null }).hedef_sayfa}&apos;de sabit
                        </span>
                      )}
                      <span className="text-gray-300">ID: {seciliFirma.id}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Firma Adı</label>
                        <input value={duzenleForm.ad || ''} onChange={e => setDuzenleForm(f => ({ ...f, ad: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Sahip</label>
                        <input value={duzenleForm.sahip || ''} onChange={e => setDuzenleForm(f => ({ ...f, sahip: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        Sahip E-posta <span className="font-normal text-gray-400">(kullanıcı firmasını düzenleyebilsin)</span>
                      </label>
                      <input
                        value={(duzenleForm as Partial<Firma & { kullanici_email: string }>).kullanici_email || ''}
                        onChange={e => setDuzenleForm(f => ({ ...f, kullanici_email: e.target.value || null }))}
                        placeholder="ornek@gmail.com"
                        className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] bg-orange-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Sektör</label>
                        <select
                          value={benzersizSektorler.includes(duzenleForm.sektor || '') ? (duzenleForm.sektor || '') : '__diger__'}
                          onChange={e => {
                            if (e.target.value === '__diger__') setDuzenleForm(f => ({ ...f, sektor: '' }));
                            else setDuzenleForm(f => ({ ...f, sektor: e.target.value }));
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] bg-white"
                        >
                          <option value="" disabled>— Sektör seçin —</option>
                          {benzersizSektorler.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="__diger__">— Diğer (yeni sektör yaz) —</option>
                        </select>
                        {(!benzersizSektorler.includes(duzenleForm.sektor || '') || duzenleForm.sektor === '') && (
                          <input
                            value={duzenleForm.sektor || ''}
                            onChange={e => setDuzenleForm(f => ({ ...f, sektor: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] mt-1"
                            placeholder="Yeni sektör adını yazın..."
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Sanayi Sitesi</label>
                        <select
                          value={benzersizSanayiSiteleri.includes(duzenleForm.sanayi_sitesi || '') ? (duzenleForm.sanayi_sitesi || '') : '__diger__'}
                          onChange={e => {
                            if (e.target.value === '__diger__') setDuzenleForm(f => ({ ...f, sanayi_sitesi: '' }));
                            else setDuzenleForm(f => ({ ...f, sanayi_sitesi: e.target.value }));
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] bg-white"
                        >
                          <option value="" disabled>— Sanayi sitesi seçin —</option>
                          {benzersizSanayiSiteleri.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="__diger__">— Diğer (yeni sanayi sitesi yaz) —</option>
                        </select>
                        {(!benzersizSanayiSiteleri.includes(duzenleForm.sanayi_sitesi || '') || duzenleForm.sanayi_sitesi === '') && (
                          <input
                            value={duzenleForm.sanayi_sitesi || ''}
                            onChange={e => setDuzenleForm(f => ({ ...f, sanayi_sitesi: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] mt-1"
                            placeholder="Yeni sanayi sitesi adını yazın..."
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Sabit Telefon</label>
                        <input value={duzenleForm.telefon || ''} onChange={e => setDuzenleForm(f => ({ ...f, telefon: e.target.value }))}
                          placeholder="0216 xxx xx xx"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Mobil Telefon</label>
                        <input value={(duzenleForm as Record<string, unknown>).mobil_telefon as string || ''} onChange={e => setDuzenleForm(f => ({ ...f, mobil_telefon: e.target.value }))}
                          placeholder="05xx xxx xx xx"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">WhatsApp numarası veya WhatsApp Business linki</label>
                      <input value={duzenleForm.whatsapp || ''} onChange={e => setDuzenleForm(f => ({ ...f, whatsapp: e.target.value }))}
                        placeholder="05xx xxx xx xx veya https://wa.me/message/..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Durum</label>
                      <select value={duzenleForm.onay_durumu || ''} onChange={e => setDuzenleForm(f => ({ ...f, onay_durumu: e.target.value as Firma['onay_durumu'] }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]">
                        <option value="beklemede">Beklemede</option>
                        <option value="onaylandi">Onaylı</option>
                        <option value="reddedildi">Reddedildi</option>
                        <option value="pasif">Yayından kaldırıldı</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Firma Tipi</label>
                      <select value={(duzenleForm as Record<string, unknown>).firma_tipi as string || 'siteli'} onChange={e => setDuzenleForm(f => ({ ...f, firma_tipi: e.target.value as Firma['firma_tipi'] }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]">
                        <option value="siteli">🏗️ Sanayi Sitesi</option>
                        <option value="sitesiz">🏪 Sanayi Dışı</option>
                        <option value="kurumsal">🏢 Kurumsal</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Adres</label>
                      <textarea value={duzenleForm.adres || ''} onChange={e => setDuzenleForm(f => ({ ...f, adres: e.target.value }))} rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">📍 Plus Code <span className="font-normal text-gray-400">(Google Haritalar)</span></label>
                      <input value={(duzenleForm as Record<string, unknown>).plus_code as string || ''} onChange={e => setDuzenleForm(f => ({ ...f, plus_code: e.target.value }))}
                        placeholder="Örn: 8GHC+2X Ümraniye, İstanbul"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                      <p className="text-xs text-gray-400 mt-1">Google Haritalar&apos;da firmanın yerine dokunun, adresin altında çıkan kısa kodu kopyalayın.</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Web Sitesi</label>
                      <input value={duzenleForm.web_sitesi || ''} onChange={e => setDuzenleForm(f => ({ ...f, web_sitesi: e.target.value }))}
                        placeholder="https://www.firmaniz.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">✉️ E-posta Adresi</label>
                      <input type="email" value={duzenleForm.eposta || ''} onChange={e => setDuzenleForm(f => ({ ...f, eposta: e.target.value }))}
                        placeholder="info@firmaniz.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {([
                        ['instagram', 'Instagram', 'instagram.com/firmaniz'],
                        ['facebook', 'Facebook', 'facebook.com/firmaniz'],
                        ['tiktok', 'TikTok', '@firmaniz'],
                        ['nsosyal', 'N Sosyal', 'nsosyal.com/firmaniz'],
                      ] as const).map(([alan, etiket, ornek]) => (
                        <div key={alan}>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1"><SosyalIkon ad={alan} /> {etiket}</label>
                          <input value={duzenleForm[alan] || ''} onChange={e => setDuzenleForm(f => ({ ...f, [alan]: e.target.value }))}
                            placeholder={ornek}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Hizmetler <span className="font-normal text-gray-400">(virgülle ayırın)</span></label>
                      <textarea
                        value={Array.isArray(duzenleForm.hizmetler) ? duzenleForm.hizmetler.join(', ') : (duzenleForm.hizmetler as unknown as string || '')}
                        onChange={e => setDuzenleForm(f => ({ ...f, hizmetler: e.target.value as unknown as string[] }))}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] resize-none"
                        placeholder="Kaynak, Tornalama, Freze..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                        📌 Hangi sayfada görünsün?
                        <span className="font-normal text-gray-400 ml-1">(boş = normal sıra)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={(duzenleForm as Partial<Firma & { hedef_sayfa: number | null }>).hedef_sayfa ?? ''}
                        onChange={e => setDuzenleForm(f => ({ ...f, hedef_sayfa: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="örn. 2"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      />
                      <p className="text-xs text-gray-400 mt-1">Firmayı belirttiğiniz sayfanın en üstüne sabitler.</p>
                    </div>
                    <div className="border border-[#e8a020]/40 bg-[#fff8ec] rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-700 mb-1">💎 Özel Firma (Sponsorlu)</p>
                      <p className="text-[11px] text-gray-500 mb-2">Başlangıç günü 00:00'da başlar, bitiş günü 23:59'da biter; süre bitince etiket kendiliğinden kalkar.</p>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-[11px] text-gray-600">Başlangıç
                          <input type="date" value={tarihKutusu(duzenleForm.ozel_baslangic)}
                            onChange={e => setDuzenleForm(f => ({ ...f, ozel_firma: true, ozel_baslangic: e.target.value ? gunBaslangici(e.target.value) : null }))}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-[#e8a020] bg-white" />
                        </label>
                        <label className="text-[11px] text-gray-600">Bitiş
                          <input type="date" value={tarihKutusu(duzenleForm.ozel_bitis)}
                            onChange={e => setDuzenleForm(f => ({ ...f, ozel_firma: true, ozel_bitis: e.target.value ? gunSonu(e.target.value) : null }))}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-[#e8a020] bg-white" />
                        </label>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-[11px] text-gray-600">
                          {ozelDurum(duzenleForm).durum === 'yok' ? 'Özel firma değil.' : ozelDurumYazisi(ozelDurum(duzenleForm), duzenleForm.ozel_bitis)}
                        </span>
                        {(duzenleForm.ozel_firma || duzenleForm.ozel_baslangic || duzenleForm.ozel_bitis) && (
                          <button type="button" onClick={() => setDuzenleForm(f => ({ ...f, ozel_firma: false, ozel_baslangic: null, ozel_bitis: null }))}
                            className="text-[11px] text-red-600 hover:underline">Özel firmalığı kaldır</button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Yorum Yönetimi ─── */}
                <AdminFirmaYorumlari firmaId={seciliFirma.id} key={`yorumlar-${seciliFirma.id}`} />

                {/* Fotoğraf yönetimi */}
                <div className="border-t pt-4 space-y-4">
                  {/* Kart resmi */}
                  <div>
                    <h3 className="font-semibold text-gray-700 text-sm mb-2">Kart Resmi</h3>
                    <div className="flex items-start gap-3">
                      {onizleme ? (
                        <div className="relative group flex-shrink-0">
                          <img src={onizleme} alt="Kart" className="w-28 h-24 object-cover rounded-lg border border-gray-200" />
                          {!fotograf && (
                            <button onClick={fotografSil} disabled={yukleniyorFoto}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="w-28 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                          Fotoğraf yok
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={dosyaSeç} className="hidden" />
                        <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors">
                          {onizleme ? 'Değiştir' : '+ Ekle'}
                        </button>
                        {fotograf && (
                          <button onClick={fotografYükle} disabled={yukleniyorFoto}
                            className="px-3 py-1.5 bg-[#1a3a6b] hover:bg-[#15306a] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                            {yukleniyorFoto ? 'Yükleniyor...' : 'Yükle'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detay fotoğraflar */}
                  <div>
                    <h3 className="font-semibold text-gray-700 text-sm mb-2">
                      Detay Fotoğraflar <span className="text-gray-400 font-normal text-xs">({(seciliFirma.detay_fotograflar || []).length}/5)</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(seciliFirma.detay_fotograflar || []).map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt={`Detay ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                          <button onClick={() => detayFotoSil(url)} disabled={detayFotoYukleniyor}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
                            ×
                          </button>
                        </div>
                      ))}
                      {(seciliFirma.detay_fotograflar || []).length < 5 && (
                        <label className="w-20 h-20 border-2 border-dashed border-gray-300 hover:border-[#e8a020] rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                          <input ref={detayFotoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={detayFotoEkle} className="hidden" />
                          <span className="text-2xl text-gray-400">+</span>
                        </label>
                      )}
                    </div>
                    {detayFotoYukleniyor && <p className="text-xs text-gray-400 mt-1">İşleniyor...</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )} {/* aktifSekme === 'firmalar' */}

      {aktifSekme === 'ilan-yonetimi' && <IlanYonetimi />}

      {aktifSekme === 'uyeler' && <UyeListesi />}

      {aktifSekme === 'istatistikler' && <Istatistikler />}

      {aktifSekme === 'site-kullanimi' && <SiteKullanimiYonetimi />}

      {aktifSekme === 'reklamlar' && <ReklamYonetimi />}
    </div>
  );
}

// ─── Ana bileşen: auth durumuna göre göster ──────────────────────────────────
export default function AdminPage() {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => {
        if (!user) setAuthState('unauthenticated');
        else if (!ADMIN_EMAILS.includes(user.email!)) setAuthState('unauthorized');
        else setAuthState('authorized');
      })
      .catch(() => setAuthState('unauthenticated'));
  }, []);

  if (authState === 'loading') return <LoadingScreen />;
  if (authState === 'unauthenticated') return <LoginScreen />;
  if (authState === 'unauthorized') return <AccessDeniedScreen />;
  return <AdminPanel />;
}

// ─── İkonlar ─────────────────────────────────────────────────────────────────
function GoogleIcon({ light }: { light?: boolean }) {
  if (light) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24">
        <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
