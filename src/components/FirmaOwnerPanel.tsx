'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import SosyalIkon from '@/components/SosyalIkon';
import { whatsappKontrol } from '@/lib/whatsapp';

type EditForm = {
  ad: string;
  sahip: string;
  sektor: string;
  sanayi_sitesi: string;
  telefon: string;
  mobil_telefon: string;
  whatsapp: string;
  adres: string;
  hizmetler: string[];
  aciklama: string;
  web_sitesi: string;
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
  eposta: string;
  nsosyal: string;
};

type Props = {
  firmaId: number;
  kullaniciEmail: string | null | undefined;
  firma: EditForm;
  fotografUrl: string | null;
  detayFotograflar: string[];
  bekleyenDegisiklikler?: Record<string, unknown> | null;
};

export default function FirmaOwnerPanel({ firmaId, kullaniciEmail, firma, fotografUrl, detayFotograflar, bekleyenDegisiklikler }: Props) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [duzenleAcik, setDuzenleAcik] = useState(false);
  const [form, setForm] = useState<EditForm>(firma);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [durum, setDurum] = useState<{ tip: 'basari' | 'hata' | 'bekliyor'; mesaj: string } | null>(null);

  // Fotoğraf state
  const [silKart, setSilKart] = useState(false);
  const [silDetaylar, setSilDetaylar] = useState<string[]>([]);
  const [yeniKart, setYeniKart] = useState<File | null>(null);
  const [yeniKartOnizleme, setYeniKartOnizleme] = useState<string | null>(null);
  const [yeniDetaylar, setYeniDetaylar] = useState<File[]>([]);
  const [yeniDetayOnizlemeler, setYeniDetayOnizlemeler] = useState<string[]>([]);
  const [fotografHata, setFotografHata] = useState<string | null>(null);

  const kartInputRef = useRef<HTMLInputElement>(null);
  const detayInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => { if (user?.email) setUserEmail(user.email); });
  }, []);

  if (!kullaniciEmail || userEmail !== kullaniciEmail) return null;

  function acDuzenle() {
    setForm(firma);
    setSilKart(false);
    setSilDetaylar([]);
    setYeniKart(null);
    setYeniKartOnizleme(null);
    setYeniDetaylar([]);
    setYeniDetayOnizlemeler([]);
    setDurum(null);
    setFotografHata(null);
    setDuzenleAcik(true);
  }

  async function fotograflariKaydet(): Promise<boolean> {
    setFotografHata(null);
    const fd = new FormData();
    fd.append('id', String(firmaId));
    if (silKart) fd.append('sil_kart', 'true');
    silDetaylar.forEach(url => fd.append('sil_detaylar', url));
    if (yeniKart) fd.append('yeni_kart', yeniKart);
    yeniDetaylar.forEach(f => fd.append('yeni_detaylar', f));

    const res = await fetch('/api/firma-fotograf-guncelle', { method: 'PATCH', body: fd });
    if (res.ok) {
      setSilKart(false);
      setSilDetaylar([]);
      setYeniKart(null);
      setYeniKartOnizleme(null);
      setYeniDetaylar([]);
      setYeniDetayOnizlemeler([]);
      return true;
    } else {
      const data = await res.json();
      setFotografHata(data.error || 'Fotoğraf güncellenemedi.');
      return false;
    }
  }

  async function kaydet() {
    const whatsapp = whatsappKontrol(form.whatsapp);
    if (whatsapp.hata) {
      setDurum({ tip: 'hata', mesaj: whatsapp.hata });
      return;
    }

    setKaydediliyor(true);
    setDurum(null);
    setFotografHata(null);

    // 1. Fotoğraf değişiklikleri varsa önce kaydet
    const fotografDegisiklikVar = silKart || silDetaylar.length > 0 || yeniKart || yeniDetaylar.length > 0;
    if (fotografDegisiklikVar) {
      const fotoOk = await fotograflariKaydet();
      if (!fotoOk) {
        setKaydediliyor(false);
        return;
      }
    }

    // 2. Metin değişikliklerini admin onayına gönder
    const hizmetler = typeof form.hizmetler === 'string'
      ? (form.hizmetler as unknown as string).split(',').map((h: string) => h.trim()).filter(Boolean)
      : form.hizmetler;

    const res = await fetch('/api/firma-duzenle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: firmaId, ...form, hizmetler }),
    });

    if (res.ok) {
      const mesaj = fotografDegisiklikVar
        ? 'Fotoğraflar güncellendi. Bilgi değişiklikleri admin onayına gönderildi.'
        : 'Değişiklikler admin onayına gönderildi. Onaylandıktan sonra sitede görünür.';
      setDurum({ tip: 'bekliyor', mesaj });
      setDuzenleAcik(false);
    } else {
      const data = await res.json();
      setDurum({ tip: 'hata', mesaj: data.error || 'Güncelleme başarısız.' });
    }
    setKaydediliyor(false);
  }

  function kartSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setYeniKart(file);
    setYeniKartOnizleme(URL.createObjectURL(file));
    setSilKart(false);
  }

  function detaySecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const mevcutSayisi = (detayFotograflar.length - silDetaylar.length) + yeniDetaylar.length;
    const eklenebilir = files.slice(0, Math.max(0, 5 - mevcutSayisi));
    setYeniDetaylar(prev => [...prev, ...eklenebilir]);
    setYeniDetayOnizlemeler(prev => [...prev, ...eklenebilir.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  }

  function yeniDetayKaldir(index: number) {
    setYeniDetaylar(prev => prev.filter((_, i) => i !== index));
    setYeniDetayOnizlemeler(prev => prev.filter((_, i) => i !== index));
  }

  const mevcutDetaySayisi = detayFotograflar.length - silDetaylar.length + yeniDetaylar.length;
  const kartMevcut = fotografUrl && !silKart;
  const kartGosterilecek = kartMevcut || yeniKartOnizleme;

  return (
    <>
      <div className="border-t border-[#dde3ec] px-6 py-4 bg-blue-50 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-[#1a3a6b] font-semibold">Bu firma size ait</span>
          {bekleyenDegisiklikler && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              Onay bekleyen değişiklikler var
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {durum && (
            <span className={`text-xs font-medium ${
              durum.tip === 'basari' ? 'text-green-700' :
              durum.tip === 'bekliyor' ? 'text-amber-700' :
              'text-red-600'
            }`}>
              {durum.mesaj}
            </span>
          )}
          <button
            onClick={acDuzenle}
            className="px-4 py-2 bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            ✏️ Düzenle
          </button>
        </div>
      </div>

      {duzenleAcik && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDuzenleAcik(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-[#1a3a6b] text-lg">Firma Bilgilerini Düzenle</h2>
              <button onClick={() => setDuzenleAcik(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-4">

              {/* FOTOĞRAF BÖLÜMÜ */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fotoğraflar</h3>

                {/* Kart Resmi */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Kart Resmi (Ana Fotoğraf)</label>
                  {kartGosterilecek ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border border-gray-200 mb-2">
                      <Image
                        src={yeniKartOnizleme || fotografUrl!}
                        alt="Kart resmi"
                        fill
                        className="object-cover"
                        sizes="400px"
                      />
                      <button
                        onClick={() => {
                          if (yeniKartOnizleme) {
                            setYeniKart(null);
                            setYeniKartOnizleme(null);
                          } else {
                            setSilKart(true);
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow"
                        title="Fotoğrafı sil"
                      >
                        ✕
                      </button>
                      {yeniKartOnizleme && (
                        <span className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">Yeni</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm mb-2">
                      Kart resmi yok
                    </div>
                  )}
                  <input ref={kartInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={kartSecildi} />
                  <button
                    onClick={() => kartInputRef.current?.click()}
                    className="w-full py-2 border border-[#1a3a6b] text-[#1a3a6b] hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    {kartGosterilecek ? '🔄 Kart Resmini Değiştir' : '+ Kart Resmi Yükle'}
                  </button>
                </div>

                {/* Detay Fotoğrafları */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">
                    Detay Fotoğrafları
                    <span className="font-normal text-gray-400 ml-1">({mevcutDetaySayisi}/5)</span>
                  </label>

                  {(detayFotograflar.length > 0 || yeniDetaylar.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {detayFotograflar.filter(url => !silDetaylar.includes(url)).map((url, i) => (
                        <div key={url} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                          <Image src={url} alt={`Detay ${i + 1}`} fill className="object-cover" sizes="120px" />
                          <button
                            onClick={() => setSilDetaylar(prev => [...prev, url])}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                            title="Sil"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {yeniDetayOnizlemeler.map((src, i) => (
                        <div key={`yeni-${i}`} className="relative aspect-video rounded-lg overflow-hidden border border-green-300">
                          <Image src={src} alt={`Yeni ${i + 1}`} fill className="object-cover" sizes="120px" />
                          <button
                            onClick={() => yeniDetayKaldir(i)}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                            title="Kaldır"
                          >
                            ✕
                          </button>
                          <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">Yeni</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {mevcutDetaySayisi < 5 && (
                    <>
                      <input ref={detayInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={detaySecildi} />
                      <button
                        onClick={() => detayInputRef.current?.click()}
                        className="w-full py-2 border border-[#1a3a6b] text-[#1a3a6b] hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        + Detay Fotoğrafı Ekle
                      </button>
                    </>
                  )}
                </div>

                {fotografHata && (
                  <p className="text-xs font-medium text-red-600">{fotografHata}</p>
                )}
              </div>

              {/* BİLGİ ALANLARI */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
                Bilgi değişiklikleri admin onayından sonra sitede görünür.
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Firma Adı</label>
                <input value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Sahip / Yetkili</label>
                  <input value={form.sahip} onChange={e => setForm(f => ({ ...f, sahip: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Sabit Telefon</label>
                  <input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                    placeholder="0216 xxx xx xx"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">📲 Mobil Telefon</label>
                <input value={form.mobil_telefon || ''} onChange={e => setForm(f => ({ ...f, mobil_telefon: e.target.value }))}
                  placeholder="05xx xxx xx xx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">💬 WhatsApp numarası veya WhatsApp Business linki</label>
                <input value={form.whatsapp || ''} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="05xx xxx xx xx veya https://wa.me/message/..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Sektör</label>
                  <input value={form.sektor} onChange={e => setForm(f => ({ ...f, sektor: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Sanayi Sitesi</label>
                  <input value={form.sanayi_sitesi} onChange={e => setForm(f => ({ ...f, sanayi_sitesi: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Adres</label>
                <textarea value={form.adres || ''} onChange={e => setForm(f => ({ ...f, adres: e.target.value }))} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Hizmetler <span className="font-normal text-gray-400">(virgülle ayırın)</span>
                </label>
                <textarea
                  value={Array.isArray(form.hizmetler) ? form.hizmetler.join(', ') : (form.hizmetler || '')}
                  onChange={e => setForm(f => ({ ...f, hizmetler: e.target.value as unknown as string[] }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] resize-none"
                  placeholder="Kaynak, Tornalama, Freze..."
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Firma Hakkında & İletişim</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Firma Hakkında</label>
                    <textarea value={form.aciklama || ''} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] resize-none"
                      placeholder="Firmanız hakkında kısa bir açıklama yazın..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">🌐 Web Sitesi</label>
                    <input value={form.web_sitesi || ''} onChange={e => setForm(f => ({ ...f, web_sitesi: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      placeholder="https://firmaniz.com" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">✉️ E-posta Adresi</label>
                    <input type="email" value={form.eposta || ''} onChange={e => setForm(f => ({ ...f, eposta: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      placeholder="info@firmaniz.com" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sosyal Medya</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">📸 Instagram</label>
                    <input value={form.instagram || ''} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      placeholder="https://instagram.com/firmaadi" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">📘 Facebook</label>
                    <input value={form.facebook || ''} onChange={e => setForm(f => ({ ...f, facebook: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      placeholder="https://facebook.com/firmaadi" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">𝕏 X (Twitter)</label>
                    <input value={form.twitter || ''} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      placeholder="https://x.com/firmaadi" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">▶ YouTube</label>
                    <input value={form.youtube || ''} onChange={e => setForm(f => ({ ...f, youtube: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      placeholder="https://youtube.com/@firmaadi" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">💼 LinkedIn</label>
                    <input value={form.linkedin || ''} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      placeholder="https://linkedin.com/company/firmaadi" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">🎵 TikTok</label>
                    <input value={form.tiktok || ''} onChange={e => setForm(f => ({ ...f, tiktok: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      placeholder="https://tiktok.com/@firmaadi" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1"><SosyalIkon ad="nsosyal" /> N Sosyal</label>
                    <input value={form.nsosyal || ''} onChange={e => setForm(f => ({ ...f, nsosyal: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b]"
                      placeholder="nsosyal.com/firmaadi" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={kaydet} disabled={kaydediliyor}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                {kaydediliyor ? 'Kaydediliyor...' : '✓ Kaydet'}
              </button>
              <button onClick={() => setDuzenleAcik(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
