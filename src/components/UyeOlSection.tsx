'use client';

import { useState } from 'react';

export default function UyeOlSection() {
  const [form, setForm] = useState({
    isim: '',
    soyisim: '',
    sabit_telefon: '',
    mobil_telefon: '',
    email: '',
  });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState<{ tip: 'basari' | 'hata'; metin: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMesaj(null);

    const { isim, soyisim, sabit_telefon, mobil_telefon, email } = form;
    if (!isim || !soyisim || !sabit_telefon || !mobil_telefon || !email) {
      setMesaj({ tip: 'hata', metin: 'Tüm alanlar zorunludur.' });
      return;
    }

    setYukleniyor(true);
    try {
      const res = await fetch('/api/uye-ol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isim, soyisim, sabit_telefon, mobil_telefon, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMesaj({ tip: 'basari', metin: 'Üyelik başvurunuz alındı! En kısa sürede size dönüş yapılacaktır.' });
        setForm({ isim: '', soyisim: '', sabit_telefon: '', mobil_telefon: '', email: '' });
      } else {
        setMesaj({ tip: 'hata', metin: data.error || 'Bir hata oluştu, lütfen tekrar deneyin.' });
      }
    } catch {
      setMesaj({ tip: 'hata', metin: 'Bağlantı hatası, lütfen tekrar deneyin.' });
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <section className="mt-8 bg-white border border-[#dde3ec] rounded-xl p-6 shadow-sm">
      <h2 className="text-[#1a3a6b] font-bold text-lg mb-1">Üye Ol</h2>
      <p className="text-sm text-gray-500 mb-5">Tüm alanların doldurulması zorunludur.</p>

      {mesaj && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          mesaj.tip === 'basari'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mesaj.metin}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
          <input
            type="text"
            name="isim"
            value={form.isim}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent"
            placeholder="Adınız"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Soyisim</label>
          <input
            type="text"
            name="soyisim"
            value={form.soyisim}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent"
            placeholder="Soyadınız"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sabit Telefon</label>
          <input
            type="tel"
            name="sabit_telefon"
            value={form.sabit_telefon}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent"
            placeholder="0212 000 00 00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobil Telefon</label>
          <input
            type="tel"
            name="mobil_telefon"
            value={form.mobil_telefon}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent"
            placeholder="0532 000 00 00"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent"
            placeholder="ornek@email.com"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full sm:w-auto bg-[#1a3a6b] hover:bg-[#2554a0] disabled:bg-gray-400 text-white px-8 py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            {yukleniyor ? 'Gönderiliyor...' : 'Üye Ol'}
          </button>
        </div>
      </form>
    </section>
  );
}
