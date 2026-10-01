"use client";

import { useState, useRef } from "react";
import { ILAN_KATEGORILERI } from "@/lib/ilanKategorileri";


const MAX_FOTO = 10;
const MAX_BOYUT_MB = 5;

type Step = "uye-ol" | "kategori" | "form" | "basarili";
type User = { id: string; email: string; name: string };
type Props = { onClose: () => void; user?: User | null };

export default function IlanVerModal({ onClose, user }: Props) {
  const kaydedilmis = !!user;

  const [step, setStep] = useState<Step>(kaydedilmis ? "kategori" : "uye-ol");
  const [uye, setUye] = useState({
    isim: kaydedilmis ? (user!.name.split(" ")[0] || "") : "",
    soyisim: kaydedilmis ? (user!.name.split(" ").slice(1).join(" ") || "") : "",
    telefon: "",
    email: kaydedilmis ? user!.email : "",
  });
  const [seciliKategori, setSeciliKategori] = useState("");
  const [form, setForm] = useState({ baslik: "", aciklama: "", fiyat: "", telefon: "" });
  const [fotograflar, setFotograflar] = useState<File[]>([]);
  const [onizlemeler, setOnizlemeler] = useState<string[]>([]);
  const [fotoHata, setFotoHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Adım göstergesi: kayıtlı kullanıcı için 2 adım, ziyaretçi için 3 adım
  const adimlar = kaydedilmis
    ? [
        { key: "kategori" as Step, label: "Kategori" },
        { key: "form" as Step, label: "İlan Detayı" },
      ]
    : [
        { key: "uye-ol" as Step, label: "Üye Ol" },
        { key: "kategori" as Step, label: "Kategori" },
        { key: "form" as Step, label: "İlan Detayı" },
      ];
  const aktifAdimIndex = adimlar.findIndex((a) => a.key === step);

  function handleUyeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUye((u) => ({ ...u, [e.target.name]: e.target.value }));
  }

  function handleUyeDevam(e: React.FormEvent) {
    e.preventDefault();
    setStep("kategori");
  }

  function handleKategoriSec(name: string) {
    setSeciliKategori(name);
    setStep("form");
  }

  function handleFotografSec(e: React.ChangeEvent<HTMLInputElement>) {
    setFotoHata(null);
    const files = Array.from(e.target.files || []);
    const bosSlot = MAX_FOTO - fotograflar.length;
    const eklenecekler: File[] = [];

    for (const file of files.slice(0, bosSlot)) {
      if (file.size > MAX_BOYUT_MB * 1024 * 1024) {
        setFotoHata(`"${file.name}" 5 MB sınırını aşıyor, atlandı.`);
        continue;
      }
      eklenecekler.push(file);
    }

    if (files.length > bosSlot) {
      setFotoHata(`En fazla ${MAX_FOTO} fotoğraf eklenebilir.`);
    }

    setFotograflar((prev) => [...prev, ...eklenecekler]);
    setOnizlemeler((prev) => [
      ...prev,
      ...eklenecekler.map((f) => URL.createObjectURL(f)),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function fotografSil(index: number) {
    URL.revokeObjectURL(onizlemeler[index]);
    setFotograflar((prev) => prev.filter((_, i) => i !== index));
    setOnizlemeler((prev) => prev.filter((_, i) => i !== index));
    setFotoHata(null);
  }

  async function handleIlanGonder(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setHata(null);

    // Kayıtlı kullanıcı: telefonu form'dan al, ad/email Google hesabından
    const telefon = kaydedilmis ? form.telefon : uye.telefon;
    const ilan_veren_ad = kaydedilmis
      ? user!.name
      : `${uye.isim} ${uye.soyisim}`.trim();
    const ilan_veren_email = kaydedilmis ? user!.email : uye.email;

    try {
      const fd = new FormData();
      fd.append("baslik", form.baslik);
      fd.append("aciklama", form.aciklama);
      if (form.fiyat) fd.append("fiyat", form.fiyat);
      fd.append("kategori", seciliKategori);
      fd.append("telefon", telefon);
      fd.append("ilan_veren_ad", ilan_veren_ad);
      fd.append("ilan_veren_email", ilan_veren_email);
      fotograflar.forEach((f) => fd.append("fotograflar", f));

      const res = await fetch("/api/ilan-ekle", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");
      setStep("basarili");
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Başlık */}
        <div className="bg-[#1a3a6b] rounded-t-2xl px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold text-lg">İlan Ver</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Adım göstergesi */}
        {step !== "basarili" && (
          <div className="flex border-b border-gray-100 flex-shrink-0">
            {adimlar.map((adim, idx) => (
              <div
                key={adim.key}
                className={`flex-1 text-center py-2 text-xs font-semibold transition-colors ${
                  idx === aktifAdimIndex
                    ? "text-[#e8a020] border-b-2 border-[#e8a020]"
                    : idx < aktifAdimIndex
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {idx < aktifAdimIndex ? "✓ " : `${idx + 1}. `}
                {adim.label}
              </div>
            ))}
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {/* ── Adım 1: Üye Ol (sadece misafir) ── */}
          {step === "uye-ol" && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                İlan verebilmek için önce bilgilerinizi girin.
              </p>
              <form onSubmit={handleUyeDevam} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">
                      İsim <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="isim" value={uye.isim} onChange={handleUyeChange} required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                      placeholder="Ali"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">
                      Soyisim <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="soyisim" value={uye.soyisim} onChange={handleUyeChange} required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                      placeholder="Yılmaz"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="telefon" value={uye.telefon} onChange={handleUyeChange} required type="tel"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    E-posta <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email" value={uye.email} onChange={handleUyeChange} required type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                    placeholder="ornek@mail.com"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#e8a020] hover:bg-[#c8851a] text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Devam Et →
                </button>
              </form>
            </>
          )}

          {/* ── Adım 2: Kategori ── */}
          {step === "kategori" && (
            <>
              {kaydedilmis && (
                <p className="text-sm text-gray-500 mb-3">
                  Merhaba, <strong>{user!.name}</strong>. Hangi kategoride ilan vermek istiyorsunuz?
                </p>
              )}
              {!kaydedilmis && (
                <p className="text-sm text-gray-500 mb-4">
                  İlanınızı hangi kategoriye vermek istiyorsunuz?
                </p>
              )}
              <div className="space-y-2">
                {ILAN_KATEGORILERI.map((kat) => (
                  <button
                    key={kat.id}
                    onClick={() => handleKategoriSec(kat.ad)}
                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-[#e8a020] hover:bg-yellow-50 text-sm font-medium text-gray-700 transition-colors"
                  >
                    {kat.ad}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Adım 3: İlan Formu ── */}
          {step === "form" && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep("kategori")} className="text-[#1a3a6b] text-sm hover:underline">
                  ← Geri
                </button>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                  {seciliKategori}
                </span>
              </div>

              <form onSubmit={handleIlanGonder} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    İlan Başlığı <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.baslik}
                    onChange={(e) => setForm((f) => ({ ...f, baslik: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                    placeholder="Örn: Satılık Honda Civic 2015"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Açıklama <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.aciklama}
                    onChange={(e) => setForm((f) => ({ ...f, aciklama: e.target.value }))}
                    required rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors resize-none"
                    placeholder="İlanınızı detaylı açıklayın..."
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Fiyat <span className="text-gray-400 font-normal">(opsiyonel)</span>
                  </label>
                  <input
                    value={form.fiyat}
                    onChange={(e) => setForm((f) => ({ ...f, fiyat: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                    placeholder="Örn: 150.000 TL veya Pazarlıklı"
                  />
                </div>

                {/* Kayıtlı kullanıcı: sadece telefon sor */}
                {kaydedilmis && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">
                      İletişim Telefonu <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.telefon}
                      onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))}
                      required type="tel"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                )}

                {/* Fotoğraf Yükleme */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Fotoğraflar{" "}
                    <span className="text-gray-400 font-normal">
                      (opsiyonel, en fazla {MAX_FOTO} adet, her biri max {MAX_BOYUT_MB} MB)
                    </span>
                  </label>

                  {onizlemeler.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {onizlemeler.map((src, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={src}
                            alt={`Fotoğraf ${i + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => fotografSil(i)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                            {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {fotograflar.length < MAX_FOTO && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFotografSec}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#e8a020] rounded-lg py-3 text-sm text-gray-500 hover:text-[#e8a020] transition-colors"
                      >
                        <span className="text-lg">📷</span>
                        Fotoğraf Ekle{" "}
                        <span className="text-xs text-gray-400">
                          ({fotograflar.length}/{MAX_FOTO})
                        </span>
                      </button>
                    </>
                  )}

                  {fotograflar.length === MAX_FOTO && (
                    <p className="text-xs text-amber-600 mt-1">
                      Maksimum fotoğraf sayısına ulaşıldı.
                    </p>
                  )}

                  {fotoHata && (
                    <p className="text-xs text-red-500 mt-1">{fotoHata}</p>
                  )}
                </div>

                {hata && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {hata}
                  </p>
                )}

                <button
                  type="submit" disabled={yukleniyor}
                  className="w-full bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {yukleniyor ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "İlanı Gönder"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── Başarı ── */}
          {step === "basarili" && (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">✅</div>
              <p className="font-bold text-[#1a3a6b] text-xl mb-2">İlanınız Alındı!</p>

              {kaydedilmis ? (
                /* Kayıtlı kullanıcı: onay uyarısı gösterme */
                <p className="text-gray-500 text-sm mb-6">
                  İlanınız başarıyla sisteme gönderildi.
                </p>
              ) : (
                /* Misafir: onay uyarısı göster */
                <>
                  <p className="text-gray-500 text-sm mb-2">
                    İlanınız incelemeye alınmıştır.
                  </p>
                  <p className="text-[#e8a020] font-semibold text-sm mb-6">
                    Onaylandıktan sonra sitede yayımlanacaktır.
                  </p>
                </>
              )}

              <button
                onClick={onClose}
                className="bg-[#1a3a6b] text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-[#2554a0] transition-colors"
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
