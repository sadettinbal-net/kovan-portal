'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SEKTORLER_SITELI } from '@/lib/sektorler-siteli';
import { SEKTORLER_SITESIZ } from '@/lib/sektorler-sitesiz';
import { TUM_KURUMSAL_ALT_KATEGORILER } from '@/lib/kategoriler-kurumsal';
import KonumSecici, { BOS_KONUM, type Konum } from '@/components/KonumSecici';

type Durum = { tip: 'basari' | 'hata'; mesaj: string } | null;

const MAX_DETAY = 5;
const MAX_MB = 5;
const IZIN_TIPLER = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function dosyaKontrol(file: File): string | null {
  if (!IZIN_TIPLER.includes(file.type)) return 'Sadece JPG, PNG, WebP veya GIF yükleyebilirsiniz.';
  if (file.size > MAX_MB * 1024 * 1024) return `Dosya ${MAX_MB}MB'dan büyük olamaz.`;
  return null;
}

// yonetici: yönetici panelinden kullanılır; kayıt onay beklemeden direkt yayına girer
export default function FirmaEkleFormu({ yonetici = false }: { yonetici?: boolean }) {
  const kartRef = useRef<HTMLInputElement>(null);
  const detayRef = useRef<HTMLInputElement>(null);

  const [konum, setKonum] = useState<Konum>(BOS_KONUM);
  const [sanayiSiteleri, setSanayiSiteleri] = useState<{ id: number; site_adi: string; ilce_adi: string | null }[]>([]);
  const [firmaTipi, setFirmaTipi] = useState<'siteli' | 'sitesiz' | 'kurumsal'>('siteli');
  const [kategoriler, setKategoriler] = useState<string[]>(SEKTORLER_SITELI);
  const [gonderiyor, setGonderiyor] = useState(false);
  const [durum, setDurum] = useState<Durum>(null);
  const [kullanici, setKullanici] = useState<{ email: string } | null | 'yukleniyor'>(yonetici ? { email: '' } : 'yukleniyor');
  const [eklenenId, setEklenenId] = useState<number | null>(null);

  const [kartResmi, setKartResmi] = useState<File | null>(null);
  const [kartOnizleme, setKartOnizleme] = useState<string | null>(null);
  const [detayFotolar, setDetayFotolar] = useState<File[]>([]);
  const [detayOnizlemeler, setDetayOnizlemeler] = useState<string[]>([]);

  const [form, setForm] = useState({
    ad: '', sahip: '', site_id: '', sektor: '',
    telefon: '', mobil_telefon: '', adres: '', plus_code: '', web_sitesi: '', hizmetler: '',
  });

  const [yeniKategoriModu, setYeniKategoriModu] = useState(false);
  const [yeniKategori, setYeniKategori] = useState('');

  useEffect(() => {
    if (yonetici) return;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => setKullanici(user ? { email: user.email } : null))
      .catch(() => setKullanici(null));
  }, [yonetici]);

  function formuSifirla() {
    setForm({ ad: '', sahip: '', site_id: '', sektor: '', telefon: '', mobil_telefon: '', adres: '', plus_code: '', web_sitesi: '', hizmetler: '' });
    setKonum(BOS_KONUM);
    setYeniKategoriModu(false);
    setYeniKategori('');
    kartKaldir();
    setDetayFotolar([]);
    setDetayOnizlemeler([]);
    setEklenenId(null);
    setDurum(null);
  }

  // Firma tipi değişince kategori listesini güncelle
  useEffect(() => {
    let baseKategoriler: string[];
    if (firmaTipi === 'siteli') {
      baseKategoriler = SEKTORLER_SITELI;
    } else if (firmaTipi === 'kurumsal') {
      baseKategoriler = TUM_KURUMSAL_ALT_KATEGORILER;
    } else {
      baseKategoriler = SEKTORLER_SITESIZ;
    }

    // Veritabanındaki diğer kategorileri de ekle
    supabase
      .from('firmalar')
      .select('sektor, sanayi_sitesi, firma_tipi')
      .not('ad', 'ilike', '(Firma%')
      .then(({ data }) => {
        const k = new Set<string>(baseKategoriler);
        for (const f of data || []) {
          if (!f.sektor) continue;

          if (firmaTipi === 'siteli') {
            const firmaninSitesi = f.sanayi_sitesi && f.sanayi_sitesi.trim() !== '';
            if (firmaninSitesi) k.add(f.sektor);
          } else if (firmaTipi === 'kurumsal') {
            if (f.firma_tipi === 'kurumsal') k.add(f.sektor);
          } else if (firmaTipi === 'sitesiz') {
            const firmaninSitesi = f.sanayi_sitesi && f.sanayi_sitesi.trim() !== '';
            if (!firmaninSitesi && f.firma_tipi !== 'kurumsal') k.add(f.sektor);
          }
        }
        setKategoriler(Array.from(k).sort((a, b) => a.localeCompare(b, 'tr')));
      });

    // Firma tipi değiştiğinde sektör seçimini sıfırla
    setForm(prev => ({ ...prev, sektor: '' }));
  }, [firmaTipi]);

  // İl seçilince o ildeki sanayi siteleri
  useEffect(() => {
    if (!konum.il) { setSanayiSiteleri([]); return; }
    supabase.from('sanayi_siteleri').select('id, site_adi, ilce_adi')
      .eq('il_adi', konum.il.toLocaleUpperCase('tr-TR')).order('site_adi')
      .then(({ data }) => setSanayiSiteleri(data || []));
  }, [konum.il]);

  // İlçe seçildiyse sadece o ilçedeki siteler
  const gorunenSiteler = konum.ilce
    ? sanayiSiteleri.filter(s => s.ilce_adi === konum.ilce.toLocaleUpperCase('tr-TR'))
    : sanayiSiteleri;

  function konumSec(yeni: Konum) {
    // İl veya ilçe değişince seçili sanayi sitesi geçersiz olur
    if (yeni.il !== konum.il || yeni.ilce !== konum.ilce) setForm(prev => ({ ...prev, site_id: '' }));
    setKonum(yeni);
    setDurum(null);
  }

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setDurum(null);
  }

  function kartSec(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const hata = dosyaKontrol(file);
    if (hata) { setDurum({ tip: 'hata', mesaj: hata }); return; }
    setKartResmi(file);
    setKartOnizleme(URL.createObjectURL(file));
    setDurum(null);
  }

  function kartKaldir() {
    setKartResmi(null);
    setKartOnizleme(null);
    if (kartRef.current) kartRef.current.value = '';
  }

  function detaySec(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const kalan = MAX_DETAY - detayFotolar.length;
    if (kalan <= 0) return;
    const eklenecekler: File[] = [];
    for (const file of files.slice(0, kalan)) {
      const hata = dosyaKontrol(file);
      if (hata) { setDurum({ tip: 'hata', mesaj: hata }); continue; }
      eklenecekler.push(file);
    }
    setDetayFotolar(prev => [...prev, ...eklenecekler]);
    setDetayOnizlemeler(prev => [...prev, ...eklenecekler.map(f => URL.createObjectURL(f))]);
    if (detayRef.current) detayRef.current.value = '';
    setDurum(null);
  }

  function detayKaldir(idx: number) {
    setDetayFotolar(prev => prev.filter((_, i) => i !== idx));
    setDetayOnizlemeler(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Sanayi sitesi içindeyse site_id zorunlu
    if (firmaTipi === 'siteli' && !form.site_id) {
      setDurum({ tip: 'hata', mesaj: 'Lütfen bir sanayi sitesi seçin.' });
      return;
    }

    // Kategori kontrolü
    const kategoriDegeri = yeniKategoriModu ? yeniKategori.trim() : form.sektor;
    if (!kategoriDegeri) {
      setDurum({ tip: 'hata', mesaj: 'Lütfen bir kategori seçin veya yeni kategori yazın.' });
      return;
    }

    if (!form.ad.trim() || !konum.il || !konum.ilce || !form.telefon.trim()) {
      setDurum({ tip: 'hata', mesaj: 'Lütfen yıldızlı zorunlu alanları doldurun.' });
      return;
    }

    setGonderiyor(true);
    setDurum(null);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    // Eğer yeni kategori modundaysa, kategoriyi ve bilgiyi gönder
    // (yönetici eklerken kategori direkt kullanılır, onaya düşmez)
    if (yeniKategoriModu) {
      fd.set('sektor', kategoriDegeri);
      if (!yonetici) {
        fd.append('yeni_kategori', '1');
        fd.append('yeni_kategori_tipi', firmaTipi);
      }
    }
    if (yonetici) fd.append('yonetici', '1');

    // Firma tipini gönder
    fd.append('firma_tipi', firmaTipi);

    fd.append('il_adi', konum.il);
    fd.append('ilce_adi', konum.ilce);
    fd.append('mahalle_id', konum.mahalleId);
    fd.append('sokak_id', konum.sokakId);
    if (kartResmi) fd.append('kart_resmi', kartResmi);
    detayFotolar.forEach(f => fd.append('detay_fotograflar', f));

    try {
      const res = await fetch('/api/firma-ekle', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        const mesaj = [json.error, json.detail, json.code].filter(Boolean).join(' — ');
        setDurum({ tip: 'hata', mesaj });
      } else {
        setEklenenId(json.id ?? null);
        setDurum({ tip: 'basari', mesaj: '' });
      }
    } catch {
      setDurum({ tip: 'hata', mesaj: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
    } finally {
      setGonderiyor(false);
    }
  }

  if (kullanici === 'yukleniyor') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-[#1a3a6b] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (kullanici === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-[#1a3a6b] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1a3a6b] mb-2">Giriş Yapmanız Gerekiyor</h2>
          <p className="text-gray-500 text-sm mb-6">Firma ekleyebilmek ve ileride firmanızı düzenleyebilmek için Google hesabınızla giriş yapmanız gerekmektedir.</p>
          <a href="/" className="inline-block bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Ana Sayfaya Dön ve Giriş Yap
          </a>
        </div>
      </div>
    );
  }

  if (durum?.tip === 'basari' && yonetici) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-green-200 p-8 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-green-700 mb-1">Firma kaydedildi ve yayında</h2>
          <p className="text-gray-500 text-sm mb-6">Onay beklemeden sitede görünür.</p>
          <div className="flex gap-3">
            {eklenenId && (
              <a href={`/firma/${eklenenId}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 bg-[#eef2f8] hover:bg-[#dde6f0] text-[#1a3a6b] font-semibold py-3 rounded-lg text-center text-sm transition-colors">
                Firmayı Gör
              </a>
            )}
            <button type="button" onClick={formuSifirla}
              className="flex-1 bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-3 rounded-lg text-sm transition-colors">
              ➕ Yeni Firma Ekle
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (durum?.tip === 'basari') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-1">Firma Kaydınız Alındı!</h2>
            <p className="text-green-100 text-sm">Başvurunuz başarıyla sisteme iletildi.</p>
          </div>
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-amber-800 mb-1">Onay Sürecinde</p>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Firmanız yönetici onayına gönderildi. Bilgileriniz incelendikten sonra rehberde yayımlanacaktır. Bu süreç genellikle <strong>1–2 iş günü</strong> içinde tamamlanmaktadır.
                  </p>
                </div>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Bilgileriniz ekibimiz tarafından inceleniyor',
                'Onaylandığında firma rehberde görünür hale gelir',
                'Profilinizden firmanızın durumunu takip edebilirsiniz',
              ].map((m, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-[#eef2f8] text-[#1a3a6b] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  {m}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Link href="/profil" className="flex-1 bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-3 rounded-lg text-center text-sm transition-colors">
                Profilime Git
              </Link>
              <Link href="/" className="flex-1 bg-[#eef2f8] hover:bg-[#dde6f0] text-[#1a3a6b] font-semibold py-3 rounded-lg text-center text-sm transition-colors">
                Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={yonetici ? 'max-w-2xl mx-auto' : 'max-w-2xl mx-auto px-4 py-6'}>
      {yonetici ? (
        <div className="bg-[#1a3a6b] rounded-xl p-5 mb-6 text-white">
          <h2 className="text-xl font-bold mb-1">Firma Ekle</h2>
          <p className="opacity-80 text-sm">Buradan eklenen firmalar onay beklemeden direkt yayına girer.</p>
        </div>
      ) : (
        <>
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-[#1a3a6b]">Anasayfa</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700">Firma Ekle</span>
          </nav>

          <div className="bg-[#1a3a6b] rounded-xl p-6 mb-6 text-white">
            <h1 className="text-2xl font-bold mb-1">Firmamı Ekle</h1>
            <p className="opacity-80 text-sm">Firmanızı rehberimize ücretsiz ekleyin, müşterilerinize kolayca ulaşın.</p>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl border border-[#dde3ec] p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Firma Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.ad} onChange={e => setField('ad', e.target.value)}
              placeholder="Firma adını girin"
              className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors" />
          </div>

          {/* Yetkili */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Kişi</label>
            <input type="text" value={form.sahip} onChange={e => setField('sahip', e.target.value)}
              placeholder="İsim soyisim"
              className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors" />
          </div>

          {/* İl, İlçe, Mahalle, Sokak */}
          <KonumSecici deger={konum} onChange={konumSec} zorunluIlIlce />

          {/* Firma Tipi Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Firma Tipi <span className="text-red-500">*</span></label>
            <div className={`grid gap-3 ${yonetici ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <button
                type="button"
                onClick={() => { setFirmaTipi('siteli'); setForm(prev => ({ ...prev, site_id: '' })); }}
                className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                  firmaTipi === 'siteli'
                    ? 'border-[#1a3a6b] bg-[#1a3a6b] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#1a3a6b]'
                }`}
              >
                🏗️ Sanayi Sitesi
              </button>
              <button
                type="button"
                onClick={() => { setFirmaTipi('sitesiz'); setForm(prev => ({ ...prev, site_id: '' })); }}
                className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                  firmaTipi === 'sitesiz'
                    ? 'border-[#e8a020] bg-[#e8a020] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-[#e8a020]'
                }`}
              >
                🏪 Sanayi Dışı
              </button>
              {yonetici && (
                <button
                  type="button"
                  onClick={() => { setFirmaTipi('kurumsal'); setForm(prev => ({ ...prev, site_id: '' })); }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                    firmaTipi === 'kurumsal'
                      ? 'border-[#059669] bg-[#059669] text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-[#059669]'
                  }`}
                >
                  🏢 Kurumsal
                </button>
              )}
            </div>
          </div>

          {/* Sanayi Sitesi Seçimi (sadece siteli için) */}
          {firmaTipi === 'siteli' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sanayi Sitesi <span className="text-red-500">*</span></label>
              <select value={form.site_id} onChange={e => setField('site_id', e.target.value)} disabled={!konum.il}
                className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors bg-white disabled:bg-gray-50">
                <option value="">{gorunenSiteler.length ? 'Seçiniz...' : konum.il ? 'Bu bölgede kayıtlı site yok' : 'Önce il seçin'}</option>
                {gorunenSiteler.map(s => <option key={s.id} value={s.id}>{s.site_adi}</option>)}
              </select>
            </div>
          )}

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>

            {!yeniKategoriModu ? (
              <>
                <select
                  value={form.sektor}
                  onChange={e => setField('sektor', e.target.value)}
                  className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors bg-white">
                  <option value="">Seçin...</option>
                  {kategoriler.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => { setYeniKategoriModu(true); setField('sektor', ''); }}
                  className="mt-2 text-xs text-[#1a3a6b] hover:underline flex items-center gap-1"
                >
                  ➕ Kategori bulamadınız mı? Yeni kategori ekleyin
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 mb-2">
                    <strong>Yeni Kategori:</strong> {yonetici
                      ? 'Kategori adını yazın, firma ile birlikte direkt sisteme eklenecek.'
                      : 'Kategori adını yazın, yönetici onayından sonra sisteme eklenecek.'}
                  </p>
                  <input
                    type="text"
                    value={yeniKategori}
                    onChange={e => setYeniKategori(e.target.value.toUpperCase())}
                    placeholder="Örn: YAZILIM & BİLİŞİM"
                    className="w-full border border-[#dde3ec] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setYeniKategoriModu(false); setYeniKategori(''); }}
                  className="text-xs text-gray-600 hover:underline"
                >
                  ← Mevcut kategorilerden seç
                </button>
              </div>
            )}
          </div>

          {/* Telefon + Adres yan yana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sabit Telefon <span className="text-red-500">*</span></label>
              <input type="tel" value={form.telefon} onChange={e => setField('telefon', e.target.value)}
                placeholder="0216 xxx xx xx"
                className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
              <input type="text" value={form.adres} onChange={e => setField('adres', e.target.value)}
                placeholder="Sanayi sitesi içindeki konumunuz"
                className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors" />
            </div>
          </div>

          {/* Plus Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📍 Plus Code <span className="text-gray-400 font-normal">(Google Haritalar)</span></label>
            <input type="text" value={form.plus_code} onChange={e => setField('plus_code', e.target.value)}
              placeholder="Örn: 8GHC+2X Ümraniye, İstanbul"
              className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors" />
            <p className="text-xs text-gray-400 mt-1">Google Haritalar&apos;da firmanızın yerine dokunun, adresin altında çıkan kısa kodu kopyalayın.</p>
          </div>

          {/* Mobil Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📲 Mobil Telefon <span className="text-gray-400 font-normal">(WhatsApp için)</span></label>
            <input type="tel" value={form.mobil_telefon} onChange={e => setField('mobil_telefon', e.target.value)}
              placeholder="05xx xxx xx xx"
              className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors" />
          </div>

          {/* Web Sitesi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Web Sitesi</label>
            <input type="url" value={form.web_sitesi} onChange={e => setField('web_sitesi', e.target.value)}
              placeholder="https://www.firmaniz.com"
              className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors" />
          </div>

          {/* Hizmetler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sunduğunuz Hizmetler</label>
            <textarea rows={2} value={form.hizmetler} onChange={e => setField('hizmetler', e.target.value)}
              placeholder="Virgülle ayırarak yazın: Motor, Yağ değişimi, Fren..."
              className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors resize-none" />
          </div>

          {/* ── KART RESMİ ── */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Kart Resmi</h3>
            <p className="text-xs text-gray-400 mb-3">Firma listesindeki kartta görünür. 1 adet, max {MAX_MB}MB.</p>

            {kartOnizleme ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[#dde3ec] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={kartOnizleme} alt="Kart önizleme" className="w-full h-full object-cover" />
                <button type="button" onClick={kartKaldir}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold">
                  ✕
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => kartRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-[#dde3ec] rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#1a3a6b] hover:text-[#1a3a6b] transition-colors cursor-pointer">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">Kart resmi seç</span>
              </button>
            )}
            <input ref={kartRef} type="file" accept="image/*" onChange={kartSec} className="hidden" />
          </div>

          {/* ── DETAY FOTOĞRAFLARI ── */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Detay Fotoğrafları</h3>
            <p className="text-xs text-gray-400 mb-3">Firma detay sayfasında görünür. En fazla {MAX_DETAY} adet, her biri max {MAX_MB}MB.</p>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
              {detayOnizlemeler.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#dde3ec] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Detay ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => detayKaldir(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">
                    ✕
                  </button>
                </div>
              ))}

              {detayFotolar.length < MAX_DETAY && (
                <button type="button" onClick={() => detayRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-[#dde3ec] flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#1a3a6b] hover:text-[#1a3a6b] transition-colors cursor-pointer">
                  <span className="text-xl leading-none">+</span>
                  <span className="text-xs">{detayFotolar.length}/{MAX_DETAY}</span>
                </button>
              )}
            </div>
            <input ref={detayRef} type="file" accept="image/*" multiple onChange={detaySec} className="hidden" />
          </div>

          {/* Durum mesajı */}
          {durum && (
            <div className="px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              ✗ {durum.mesaj}
            </div>
          )}

          <button type="submit" disabled={gonderiyor}
            className="w-full bg-[#1a3a6b] hover:bg-[#2554a0] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
            {gonderiyor ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Kaydediliyor...</>
            ) : yonetici ? 'Firmayı Kaydet ve Yayınla' : 'Firma Kaydını Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
}
