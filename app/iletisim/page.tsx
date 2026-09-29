'use client';

import { useState } from 'react';
import Link from 'next/link';
import UstMenu from '@/components/site/UstMenu';
import AltBilgi from '@/components/site/AltBilgi';

const bosForm = { ad_soyad: '', telefon: '', eposta: '', mesaj: '' };

// İletişim sayfası: mesaj formu ve bilgiler
export default function IletisimPage() {
  const [form, setForm] = useState(bosForm);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState('');

  const alan = (key: keyof typeof bosForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata('');
    if (!form.ad_soyad.trim() || !form.mesaj.trim()) {
      setHata('Ad soyad ve mesaj zorunludur');
      return;
    }
    setGonderiliyor(true);
    try {
      const response = await fetch('/api/iletisim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setGonderildi(true);
        setForm(bosForm);
      } else {
        setHata((await response.json()).error || 'Mesaj gönderilemedi');
      }
    } catch {
      setHata('Mesaj gönderilemedi');
    } finally {
      setGonderiliyor(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-[#dde3ec] rounded-md focus:ring-2 focus:ring-[#2554a0] focus:border-transparent outline-none';

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-gray-800">
      <UstMenu />

      <section className="bg-[#1a3a6b] px-4 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">İletişim</h1>
        <p className="mt-2 text-white/80">Soru, öneri ve firma kayıtlarıyla ilgili bize yazın.</p>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
          {gonderildi ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-lg font-bold text-[#1a3a6b]">Mesajınız gönderildi</p>
              <p className="text-gray-600 mt-2">En kısa sürede size dönüş yapacağız.</p>
              <button onClick={() => setGonderildi(false)} className="mt-6 text-[#2554a0] font-semibold hover:underline">
                Yeni mesaj yaz
              </button>
            </div>
          ) : (
            <form onSubmit={gonder} className="space-y-4">
              <h2 className="text-lg font-bold text-[#1a3a6b]">Mesaj Gönderin</h2>
              <div>
                <label htmlFor="ad_soyad" className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input id="ad_soyad" type="text" autoComplete="name" {...alan('ad_soyad')} className={inputClass} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input id="telefon" type="tel" autoComplete="tel" {...alan('telefon')} className={inputClass} placeholder="05xx xxx xx xx" />
                </div>
                <div>
                  <label htmlFor="eposta" className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                  <input id="eposta" type="email" autoComplete="email" {...alan('eposta')} className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="mesaj" className="block text-sm font-medium text-gray-700 mb-1">
                  Mesajınız <span className="text-red-500">*</span>
                </label>
                <textarea id="mesaj" rows={6} {...alan('mesaj')} className={inputClass} required />
              </div>
              {hata && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{hata}</div>}
              <button
                type="submit"
                disabled={gonderiliyor}
                className="w-full sm:w-auto px-8 py-3 bg-[#e8a020] hover:bg-[#c8851a] text-white font-bold rounded-md transition disabled:opacity-50"
              >
                {gonderiliyor ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-bold text-[#1a3a6b] mb-3">Firmanızı Ekleyin</h2>
            <p className="text-sm text-gray-600">
              Firmanızı rehberimize ücretsiz ekleyin, müşterilerinize kolayca ulaşın.
            </p>
            <Link
              href="/firma-ekle"
              className="inline-block mt-4 bg-[#1a3a6b] hover:bg-[#0f2548] text-white font-bold px-4 py-2 rounded-md transition"
            >
              Firma Ekle →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-sm text-gray-600">
            <h2 className="font-bold text-[#1a3a6b] mb-3">İletişim Bilgileri</h2>
            <p>Telefon ve e-posta bilgileri yakında eklenecek.</p>
          </div>
        </aside>
      </main>

      <AltBilgi />
    </div>
  );
}
