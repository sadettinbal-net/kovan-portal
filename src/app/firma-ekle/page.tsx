'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SEKTORLER } from '@/lib/sektorler';

type Durum = { tip: 'basari' | 'hata'; mesaj: string } | null;

const MAX_DETAY = 5;
const MAX_MB = 5;
const IZIN_TIPLER = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function dosyaKontrol(file: File): string | null {
  if (!IZIN_TIPLER.includes(file.type)) return 'Sadece JPG, PNG, WebP veya GIF yükleyebilirsiniz.';
  if (file.size > MAX_MB * 1024 * 1024) return `Dosya ${MAX_MB}MB'dan büyük olamaz.`;
  return null;
}

export default function FirmaEklePage() {
  const kartRef = useRef<HTMLInputElement>(null);
  const detayRef = useRef<HTMLInputElement>(null);

  const [iller, setIller] = useState<{ id: number; sehir_adi: string }[]>([]);
  const [ilceler, setIlceler] = useState<{ id: number; ilce_adi: string }[]>([]);
  const [sanayiSiteleri, setSanayiSiteleri] = useState<{ id: number; site_adi: string; ilce_adi: string | null }[]>([]);
  const [kategoriler, setKategoriler] = useState<string[]>(SEKTORLER);
  const [gonderiyor, setGonderiyor] = useState(false);
  const [durum, setDurum] = useState<Durum>(null);
  const [kullanici, setKullanici] = useState<{ email: string } | null | 'yukleniyor'>('yukleniyor');

  const [kartResmi, setKartResmi] = useState<File | null>(null);
  const [kartOnizleme, setKartOnizleme] = useState<string | null>(null);
  const [detayFotolar, setDetayFotolar] = useState<File[]>([]);
  const [detayOnizlemeler, setDetayOnizlemeler] = useState<string[]>([]);

  const [form, setForm] = useState({
    ad: '', sahip: '', il_adi: '', ilce_adi: '', site_id: '', sektor: '',
    telefon: '', mobil_telefon: '', adres: '', web_sitesi: '', hizmetler: '',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => setKullanici(user ? { email: user.email } : null))
      .catch(() => setKullanici(null));
  }, []);

  // İller ve kategoriler (sabit sektörler + firmalarda kullanılan diğerleri)
  useEffect(() => {
    supabase.from('iller').select('id, sehir_adi').order('sehir_adi')
      .then(({ data }) => setIller(data || []));
    supabase
      .from('firmalar')
      .select('sektor')
      .not('ad', 'ilike', '(Firma%')
      .then(({ data }) => {
        const k = new Set<string>(SEKTORLER);
        for (const f of data || []) if (f.sektor) k.add(f.sektor);
        setKategoriler(Array.from(k).sort((a, b) => a.localeCompare(b, 'tr')));
      });
  }, []);

  // İl seçilince ilçeler ve o ildeki sanayi siteleri
  useEffect(() => {
    const il = iller.find(i => i.sehir_adi === form.il_adi);
    if (!il) { setIlceler([]); setSanayiSiteleri([]); return; }
    supabase.from('ilceler').select('id, ilce_adi').eq('sehir_id', il.id).order('ilce_adi')
      .then(({ data }) => setIlceler(data || []));
    supabase.from('sanayi_siteleri').select('id, site_adi, ilce_adi')
      .eq('il_adi', il.sehir_adi.toLocaleUpperCase('tr-TR')).order('site_adi')
      .then(({ data }) => setSanayiSiteleri(data || []));
  }, [form.il_adi, iller]);

  // İlçe seçildiyse sadece o ilçedeki siteler
  const gorunenSiteler = form.ilce_adi
    ? sanayiSiteleri.filter(s => s.ilce_adi === form.ilce_adi.toLocaleUpperCase('tr-TR'))
    : sanayiSiteleri;

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
    if (!form.ad.trim() || !form.il_adi || !form.ilce_adi || !form.sektor || !form.telefon.trim()) {
      setDurum({ tip: 'hata', mesaj: 'Lütfen yıldızlı zorunlu alanları doldurun.' });
      return;
    }

    setGonderiyor(true);
    setDurum(null);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (kartResmi) fd.append('kart_resmi', kartResmi);
    detayFotolar.forEach(f => fd.append('detay_fotograflar', f));

    try {
      const res = await fetch('/api/firma-ekle', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        const mesaj = [json.error, json.detail, json.code].filter(Boolean).join(' — ');
        setDurum({ tip: 'hata', mesaj });
      } else {
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#1a3a6b]">Anasayfa</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Firma Ekle</span>
      </nav>

      <div className="bg-[#1a3a6b] rounded-xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Firmamı Ekle</h1>
        <p className="opacity-80 text-sm">Firmanızı rehberimize ücretsiz ekleyin, müşterilerinize kolayca ulaşın.</p>
      </div>

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

          {/* İl + İlçe yan yana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İl <span className="text-red-500">*</span></label>
              <select value={form.il_adi}
                onChange={e => setForm(prev => ({ ...prev, il_adi: e.target.value, ilce_adi: '', site_id: '' }))}
                className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors bg-white">
                <option value="">Seçin...</option>
                {iller.map(i => <option key={i.id} value={i.sehir_adi}>{i.sehir_adi}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İlçe <span className="text-red-500">*</span></label>
              <select value={form.ilce_adi} disabled={!form.il_adi}
                onChange={e => setForm(prev => ({ ...prev, ilce_adi: e.target.value, site_id: '' }))}
                className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors bg-white disabled:bg-gray-50">
                <option value="">{form.il_adi ? 'Seçin...' : 'Önce il seçin'}</option>
                {ilceler.map(i => <option key={i.id} value={i.ilce_adi}>{i.ilce_adi}</option>)}
              </select>
            </div>
          </div>

          {/* Sanayi Sitesi + Kategori yan yana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sanayi Sitesi</label>
              <select value={form.site_id} onChange={e => setField('site_id', e.target.value)} disabled={!form.il_adi}
                className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors bg-white disabled:bg-gray-50">
                <option value="">{gorunenSiteler.length ? 'Sanayi sitesi dışında / listede yok' : form.il_adi ? 'Bu bölgede kayıtlı site yok' : 'Önce il seçin'}</option>
                {gorunenSiteler.map(s => <option key={s.id} value={s.id}>{s.site_adi}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>
              <select value={form.sektor} onChange={e => setField('sektor', e.target.value)}
                className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors bg-white">
                <option value="">Seçin...</option>
                {kategoriler.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
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
            ) : 'Firma Kaydını Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
}
