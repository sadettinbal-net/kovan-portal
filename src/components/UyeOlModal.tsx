"use client";

import { useState } from "react";

type Props = { onClose: () => void };

export default function UyeOlModal({ onClose }: Props) {
  const [form, setForm] = useState({ isim: "", soyisim: "", telefon: "", adres: "", email: "" });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/uye-ol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Bir hata oluştu.");
      setBasarili(true);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-[#1a3a6b] rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Üye Ol</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          {basarili ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-[#1a3a6b] text-lg mb-1">Kaydınız alındı!</p>
              <p className="text-gray-500 text-sm mb-4">En kısa sürede sizinle iletişime geçeceğiz.</p>
              <button onClick={onClose} className="bg-[#1a3a6b] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#2554a0] transition-colors">
                Kapat
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">İsim <span className="text-red-500">*</span></label>
                  <input
                    name="isim" value={form.isim} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                    placeholder="Ali"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Soyisim <span className="text-red-500">*</span></label>
                  <input
                    name="soyisim" value={form.soyisim} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                    placeholder="Yılmaz"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Telefon <span className="text-red-500">*</span></label>
                <input
                  name="telefon" value={form.telefon} onChange={handleChange} required type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                  placeholder="05XX XXX XX XX"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">E-posta <span className="text-red-500">*</span></label>
                <input
                  name="email" value={form.email} onChange={handleChange} required type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                  placeholder="ornek@mail.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Adres <span className="text-red-500">*</span></label>
                <textarea
                  name="adres" value={form.adres} onChange={handleChange} required rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors resize-none"
                  placeholder="Mahalle, sokak, şehir..."
                />
              </div>

              {hata && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{hata}</p>}

              <button
                type="submit" disabled={yukleniyor}
                className="w-full bg-[#e8a020] hover:bg-[#c8851a] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {yukleniyor ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Kaydediliyor...</>
                ) : "Üye Ol"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
