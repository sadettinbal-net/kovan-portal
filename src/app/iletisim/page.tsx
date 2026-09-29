'use client';

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function IletisimPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ ad: '', telefon: '', email: '', mesaj: '' });
  const [durum, setDurum] = useState<'bos' | 'gonderiliyor' | 'basarili' | 'hata'>('bos');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ad.trim() || !form.mesaj.trim()) return;
    setDurum('gonderiliyor');
    try {
      const res = await fetch('/api/mesaj-gonder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDurum('basarili');
        setForm({ ad: '', telefon: '', email: '', mesaj: '' });
      } else {
        setDurum('hata');
      }
    } catch {
      setDurum('hata');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#1a3a6b]">{t.breadHome}</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{t.contactTitle}</span>
      </nav>

      <div className="bg-[#1a3a6b] rounded-xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-1">{t.contactTitle}</h1>
        <p className="opacity-80 text-sm">{t.contactSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#dde3ec] p-5">
            <h2 className="font-semibold text-[#1a3a6b] mb-4">{t.contactInfoTitle}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  📞
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t.phoneTitle}</div>
                  <a href="tel:05353594763" className="font-semibold text-[#1a3a6b] hover:underline">
                    0535 359 47 63
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  ✉️
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t.emailTitle}</div>
                  <a
                    href="mailto:info@umraniyesanayisitesi.com"
                    className="font-semibold text-[#1a3a6b] hover:underline text-sm"
                  >
                    info@umraniyesanayisitesi.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  📍
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t.locationTitle}</div>
                  <div className="font-semibold text-[#1a3a6b]">Ümraniye, İstanbul</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#dde3ec] p-5">
            <h2 className="font-semibold text-[#1a3a6b] mb-3">{t.addCompanyTitle}</h2>
            <p className="text-gray-600 text-sm mb-3">
              {t.addCompanyDesc}
            </p>
            <Link
              href="/firma-ekle"
              className="block text-center bg-[#e8a020] hover:bg-[#c8851a] text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            >
              {t.addCompanyBtn}
            </Link>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl border border-[#dde3ec] p-5">
          <h2 className="font-semibold text-[#1a3a6b] mb-4">{t.sendMessageTitle}</h2>

          {durum === 'basarili' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold text-green-700">{t.messageSent}</p>
              <p className="text-sm text-gray-500 mt-1">{t.messageReply}</p>
              <button
                onClick={() => setDurum('bos')}
                className="mt-4 text-sm text-[#1a3a6b] underline"
              >
                {t.sendAnother}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {durum === 'hata' && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {t.messageFailed}
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.fullNameLabel} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="ad"
                  value={form.ad}
                  onChange={handleChange}
                  placeholder={t.namePlaceholder}
                  required
                  className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.phoneFormLabel}</label>
                <input
                  type="tel"
                  name="telefon"
                  value={form.telefon}
                  onChange={handleChange}
                  placeholder="0xxx xxx xx xx"
                  className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.emailFormLabel}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.messageLabel} <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  name="mesaj"
                  value={form.mesaj}
                  onChange={handleChange}
                  placeholder={t.messagePlaceholder}
                  required
                  className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1a3a6b] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={durum === 'gonderiliyor'}
                className="w-full bg-[#1a3a6b] hover:bg-[#2554a0] disabled:opacity-60 text-white py-3 rounded-lg font-semibold text-sm transition-colors"
              >
                {durum === 'gonderiliyor' ? t.sendingBtn : t.sendBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
