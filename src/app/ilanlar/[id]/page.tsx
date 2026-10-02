"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cepWhatsappAdresi } from "@/lib/whatsapp";

type Ilan = {
  id: number;
  baslik: string;
  aciklama: string;
  kategori: string;
  fiyat: string | null;
  telefon: string;
  ilan_veren_ad: string;
  fotograflar: string[] | null;
  created_at: string;
};

export default function IlanDetayPage() {
  const { id } = useParams<{ id: string }>();
  const [ilan, setIlan] = useState<Ilan | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bulunamadi, setBulunamadi] = useState(false);
  const [buyukFoto, setBuyukFoto] = useState(0);

  useEffect(() => {
    async function getir() {
      setYukleniyor(true);
      const res = await fetch(`/api/ilanlar/${id}`);
      if (res.ok) {
        const data = await res.json();
        setIlan(data.ilan);
      } else {
        setBulunamadi(true);
      }
      setYukleniyor(false);
    }
    if (id) getir();
  }, [id]);

  if (yukleniyor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  if (bulunamadi || !ilan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-[#1a3a6b] mb-2">İlan Bulunamadı</h1>
        <p className="text-gray-500 mb-6">Bu ilan mevcut değil veya yayından kaldırılmış.</p>
        <Link href="/ilanlar" className="bg-[#1a3a6b] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#2554a0] transition-colors">
          İlanlara Dön
        </Link>
      </div>
    );
  }

  const fotograflar = ilan.fotograflar || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-[#1a3a6b]">Anasayfa</Link>
        <span className="mx-2">›</span>
        <Link href="/ilanlar" className="hover:text-[#1a3a6b]">İlanlar</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700 line-clamp-1">{ilan.baslik}</span>
      </nav>

      <div className="bg-white border border-[#dde3ec] rounded-xl overflow-hidden">
        {/* Başlık */}
        <div className="bg-[#1a3a6b] px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-white font-bold text-xl leading-snug">{ilan.baslik}</h1>
            <span className="flex-shrink-0 bg-[#e8a020] text-white text-xs font-bold px-3 py-1 rounded-full">
              {ilan.kategori}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/80">
            {ilan.fiyat && (
              <span className="text-[#ffd166] font-bold text-base">💰 {ilan.fiyat}</span>
            )}
            <span>📅 {new Date(ilan.created_at).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Fotoğraf Galerisi - Tüm fotoğraflar */}
          {fotograflar.length > 0 && (
            <div>
              {/* Büyük görüntü */}
              <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-3">
                <img
                  src={fotograflar[buyukFoto]}
                  alt={`${ilan.baslik} - Fotoğraf ${buyukFoto + 1}`}
                  className="w-full max-h-[420px] object-contain"
                />
                {fotograflar.length > 1 && (
                  <>
                    <button
                      onClick={() => setBuyukFoto((p) => (p - 1 + fotograflar.length) % fotograflar.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setBuyukFoto((p) => (p + 1) % fotograflar.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
                    >
                      ›
                    </button>
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                      {buyukFoto + 1} / {fotograflar.length}
                    </span>
                  </>
                )}
              </div>

              {/* Thumbnail şeridi */}
              {fotograflar.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {fotograflar.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setBuyukFoto(i)}
                      className={`flex-shrink-0 w-18 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === buyukFoto
                          ? "border-[#e8a020] shadow-md"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ width: "72px" }}
                    >
                      <img src={url} alt={`Küçük ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Açıklama */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h2 className="font-bold text-[#1a3a6b] text-sm uppercase tracking-wide mb-3">
              İlan Açıklaması
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {ilan.aciklama}
            </p>
          </div>

          {/* Detay Bilgiler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h2 className="font-bold text-[#1a3a6b] text-sm uppercase tracking-wide">İletişim</h2>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="text-xs text-gray-500">Telefon</p>
                  <a href={`tel:${ilan.telefon}`} className="font-bold text-[#1a3a6b] hover:underline">
                    {ilan.telefon}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="text-xs text-gray-500">İlan Veren</p>
                  <p className="font-semibold text-gray-800">{ilan.ilan_veren_ad}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h2 className="font-bold text-[#1a3a6b] text-sm uppercase tracking-wide">İlan Bilgileri</h2>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏷️</span>
                <div>
                  <p className="text-xs text-gray-500">Kategori</p>
                  <p className="font-semibold text-gray-800">{ilan.kategori}</p>
                </div>
              </div>
              {ilan.fiyat && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-xs text-gray-500">Fiyat</p>
                    <p className="font-bold text-green-700">{ilan.fiyat}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-xs text-gray-500">İlan Tarihi</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(ilan.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* İletişim Butonları */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:${ilan.telefon}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a3a6b] hover:bg-[#2554a0] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              📞 Ara: {ilan.telefon}
            </a>
            {/* WhatsApp sadece cep numarasında (firmalardaki ortak kural; sabit hatta WhatsApp yok) */}
            {cepWhatsappAdresi(ilan.telefon) && (
              <a
                href={cepWhatsappAdresi(ilan.telefon)!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                WhatsApp ile Yaz
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/ilanlar" className="text-sm text-[#1a3a6b] hover:underline">
          ← İlanlara Dön
        </Link>
      </div>
    </div>
  );
}
