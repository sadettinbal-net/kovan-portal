"use client";

import { useState, useRef } from "react";
import { ILAN_KATEGORILERI } from "@/lib/ilanKategorileri";
import { gonderimSiniriUyarisi, GONDERIM_SINIRI_MB, resmiKucult, toplamMB } from "@/lib/resimKucult";

const MAX_FOTO = 10;
const KABUL_EDILEN = "image/jpeg,image/png,image/webp";

type Step = "giris" | "kategori" | "form" | "basarili";
type User = { id: string; email: string; name: string };
type Props = { onClose: () => void; user?: User | null };

// İlan vermek için Google ile giriş zorunlu; ad ve e-posta sunucuda oturumdan alınır.
// Fotoğraflar seçilince tarayıcıda küçültülür (en uzun kenar 1600 px); toplam 4 MB'ı geçerse uyarı verilir.
export default function IlanVerModal({ onClose, user }: Props) {
  const [step, setStep] = useState<Step>(user ? "kategori" : "giris");
  const [seciliKategori, setSeciliKategori] = useState("");
  const [form, setForm] = useState({ baslik: "", aciklama: "", fiyat: "", telefon: "" });
  const [fotograflar, setFotograflar] = useState<File[]>([]);
  const [onizlemeler, setOnizlemeler] = useState<string[]>([]);
  const [fotoHata, setFotoHata] = useState<string | null>(null);
  const [kucultuluyor, setKucultuluyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adimlar = [
    { key: "kategori" as Step, label: "Kategori" },
    { key: "form" as Step, label: "İlan Detayı" },
  ];
  const aktifAdimIndex = adimlar.findIndex((a) => a.key === step);
  const toplam = toplamMB(fotograflar);
  const sinirAsildi = toplam > GONDERIM_SINIRI_MB;

  async function handleFotografSec(e: React.ChangeEvent<HTMLInputElement>) {
    setFotoHata(null);
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const bosSlot = MAX_FOTO - fotograflar.length;
    if (files.length > bosSlot) setFotoHata(`En fazla ${MAX_FOTO} fotoğraf eklenebilir.`);

    setKucultuluyor(true);
    const eklenecekler: File[] = [];
    for (const file of files.slice(0, bosSlot)) {
      if (!KABUL_EDILEN.split(",").includes(file.type)) {
        setFotoHata(`"${file.name}" atlandı: sadece JPG, PNG veya WEBP yükleyebilirsiniz.`);
        continue;
      }
      eklenecekler.push(await resmiKucult(file));
    }
    setKucultuluyor(false);

    setFotograflar((prev) => [...prev, ...eklenecekler]);
    setOnizlemeler((prev) => [...prev, ...eklenecekler.map((f) => URL.createObjectURL(f))]);
  }

  function fotografSil(index: number) {
    URL.revokeObjectURL(onizlemeler[index]);
    setFotograflar((prev) => prev.filter((_, i) => i !== index));
    setOnizlemeler((prev) => prev.filter((_, i) => i !== index));
    setFotoHata(null);
  }

  async function handleIlanGonder(e: React.FormEvent) {
    e.preventDefault();
    if (sinirAsildi) { setHata(gonderimSiniriUyarisi(toplam)); return; }
    setYukleniyor(true);
    setHata(null);
    try {
      const fd = new FormData();
      fd.append("baslik", form.baslik);
      fd.append("aciklama", form.aciklama);
      if (form.fiyat) fd.append("fiyat", form.fiyat);
      fd.append("kategori", seciliKategori);
      fd.append("telefon", form.telefon);
      fotograflar.forEach((f) => fd.append("fotograflar", f));

      const res = await fetch("/api/ilan-ekle", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.status === 413) throw new Error(gonderimSiniriUyarisi(toplam));
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
        {(step === "kategori" || step === "form") && (
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
          {/* ── Giriş gerekli ── */}
          {step === "giris" && (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🔐</div>
              <p className="font-bold text-[#1a3a6b] text-lg mb-2">İlan vermek için giriş yapın</p>
              <p className="text-sm text-gray-500 mb-6">
                İlanlarınız Google hesabınızla ilişkilendirilir. Günde en fazla 3 ilan verebilirsiniz.
              </p>
              <button
                onClick={() => { window.location.href = "/api/auth/google"; }}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
              >
                <span className="font-bold text-[#4285F4]">G</span> Google ile giriş yap
              </button>
            </div>
          )}

          {/* ── Adım 1: Kategori ── */}
          {step === "kategori" && (
            <>
              <p className="text-sm text-gray-500 mb-3">
                Merhaba, <strong>{user?.name}</strong>. Hangi kategoride ilan vermek istiyorsunuz?
              </p>
              <div className="space-y-2">
                {ILAN_KATEGORILERI.map((kat) => (
                  <button
                    key={kat.id}
                    onClick={() => { setSeciliKategori(kat.ad); setStep("form"); }}
                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-[#e8a020] hover:bg-yellow-50 text-sm font-medium text-gray-700 transition-colors"
                  >
                    {kat.ad}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Adım 2: İlan Formu ── */}
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
                    required minLength={5} maxLength={100}
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
                    required minLength={10} maxLength={3000} rows={3}
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
                    maxLength={50}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                    placeholder="Örn: 150.000 TL veya Pazarlıklı"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    İletişim Telefonu <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.telefon}
                    onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))}
                    required type="tel" maxLength={20}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a3a6b] transition-colors"
                    placeholder="0532 123 45 67 veya 0216 123 45 67"
                  />
                </div>

                {/* Fotoğraf Yükleme */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Fotoğraflar{" "}
                    <span className="text-gray-400 font-normal">
                      (opsiyonel, JPG/PNG/WEBP, en fazla {MAX_FOTO} adet; otomatik küçültülür)
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
                        accept={KABUL_EDILEN}
                        multiple
                        className="hidden"
                        onChange={handleFotografSec}
                      />
                      <button
                        type="button"
                        disabled={kucultuluyor}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#e8a020] rounded-lg py-3 text-sm text-gray-500 hover:text-[#e8a020] transition-colors disabled:opacity-50"
                      >
                        <span className="text-lg">📷</span>
                        {kucultuluyor ? "Fotoğraflar hazırlanıyor..." : "Fotoğraf Ekle"}{" "}
                        <span className="text-xs text-gray-400">
                          ({fotograflar.length}/{MAX_FOTO})
                        </span>
                      </button>
                    </>
                  )}

                  {fotograflar.length > 0 && (
                    <p className={`text-xs mt-1 ${sinirAsildi ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                      {sinirAsildi ? gonderimSiniriUyarisi(toplam) : `Toplam ${toplam.toFixed(1)} MB / ${GONDERIM_SINIRI_MB} MB`}
                    </p>
                  )}
                  {fotoHata && <p className="text-xs text-red-500 mt-1">{fotoHata}</p>}
                </div>

                {hata && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {hata}
                  </p>
                )}

                <button
                  type="submit" disabled={yukleniyor || kucultuluyor || sinirAsildi}
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
              <p className="text-gray-500 text-sm mb-2">İlanınız incelemeye alınmıştır.</p>
              <p className="text-[#e8a020] font-semibold text-sm mb-6">Onaylandıktan sonra sitede yayımlanacaktır.</p>
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
