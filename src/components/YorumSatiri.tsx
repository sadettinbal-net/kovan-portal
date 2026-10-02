"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const SIKAYET_SEBEPLERI = ["hakaret", "yaniltici", "kisisel_bilgi", "reklam", "konu_disi", "diger"] as const;

export interface YorumSatirVerisi {
  id: number;
  kullanici_ad: string;
  yorum: string;
  puan: number;
  created_at: string;
  guncelleme_tarihi: string | null;
  cevap: string | null;
  cevap_tarihi?: string | null;
  cevap_guncelleme_tarihi?: string | null;
  cevap_gizli?: boolean;
}

// Firma sayfasındaki tek yorum: yıldızlar, metin, "Firma yanıtı";
// firma sahibine Yanıtla/Yanıtı düzenle, giriş yapmış diğerlerine Şikâyet et.
export default function YorumSatiri({
  yorum: y,
  sahibi,
  girisli,
  kendiYorumu,
  sikayetEdildi,
  yildizlar,
  onDegisti,
}: {
  yorum: YorumSatirVerisi;
  sahibi: boolean;
  girisli: boolean;
  kendiYorumu: boolean;
  sikayetEdildi: boolean;
  yildizlar: React.ReactNode;
  onDegisti: () => void;
}) {
  const { t } = useLanguage();
  const tarih = (d: string) => new Date(d).toLocaleDateString(t.memberSinceDateLocale);

  const [cevapAcik, setCevapAcik] = useState(false);
  const [cevapMetin, setCevapMetin] = useState("");
  const [sikayetAcik, setSikayetAcik] = useState(false);
  const [sebep, setSebep] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");

  async function cevapKaydet() {
    setGonderiyor(true);
    setHata("");
    const res = await fetch("/api/yorum/cevap", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yorum_id: y.id, cevap: cevapMetin }),
    });
    const data = await res.json();
    if (res.ok) {
      setCevapAcik(false);
      onDegisti();
    } else {
      setHata(data.error || t.reviewError);
    }
    setGonderiyor(false);
  }

  async function sikayetGonder() {
    if (!sebep) return;
    setGonderiyor(true);
    setHata("");
    const res = await fetch("/api/yorum/sikayet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yorum_id: y.id, sebep, aciklama }),
    });
    const data = await res.json();
    if (res.ok || res.status === 409) {
      setSikayetAcik(false);
      setBilgi(res.ok ? t.reportThanks : data.error);
      onDegisti();
    } else {
      setHata(data.error || t.reviewError);
    }
    setGonderiyor(false);
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1a3a6b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {y.kullanici_ad.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-800 leading-tight">{y.kullanici_ad}</div>
            {yildizlar}
          </div>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 pt-1">
          {tarih(y.created_at)}
          {y.guncelleme_tarihi && ` · ${t.editedLabel}`}
        </span>
      </div>
      {y.yorum && <p className="text-sm text-gray-600 leading-relaxed pl-[42px] whitespace-pre-line">{y.yorum}</p>}

      {/* Firma yanıtı */}
      {y.cevap && !cevapAcik && (
        <div className={`ml-[42px] mt-3 rounded-lg border-l-4 px-3 py-2 ${y.cevap_gizli ? "bg-gray-50 border-gray-300" : "bg-[#f0f4fa] border-[#1a3a6b]"}`}>
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-xs font-bold text-[#1a3a6b]">💬 {t.firmReplyLabel}</span>
            {y.cevap_tarihi && (
              <span className="text-[11px] text-gray-400">
                {tarih(y.cevap_tarihi)}
                {y.cevap_guncelleme_tarihi && ` · ${t.editedLabel}`}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-line">{y.cevap}</p>
          {y.cevap_gizli && <p className="text-xs text-gray-500 mt-1">🙈 {t.replyHiddenNote}</p>}
        </div>
      )}

      {/* Firma sahibi: yanıt formu */}
      {sahibi && cevapAcik && (
        <div className="ml-[42px] mt-3">
          <textarea
            value={cevapMetin}
            onChange={(e) => setCevapMetin(e.target.value)}
            placeholder={t.replyPlaceholder}
            rows={3}
            maxLength={1000}
            className="w-full border border-[#dde3ec] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1a3a6b]"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={cevapKaydet} disabled={gonderiyor}
              className="px-4 py-1.5 bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-xs font-semibold rounded-lg disabled:opacity-50">
              {gonderiyor ? t.submittingBtn : t.saveReplyBtn}
            </button>
            <button onClick={() => { setCevapAcik(false); setHata(""); }} disabled={gonderiyor}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg">
              {t.cancelText}
            </button>
          </div>
        </div>
      )}

      {/* Şikâyet formu */}
      {sikayetAcik && (
        <div className="ml-[42px] mt-3 bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">{t.reportTitle}</p>
          <div className="grid sm:grid-cols-2 gap-1 mb-2">
            {SIKAYET_SEBEPLERI.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name={`sebep-${y.id}`} value={s} checked={sebep === s} onChange={() => setSebep(s)} />
                {t.reportReasons[s]}
              </label>
            ))}
          </div>
          <textarea
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            placeholder={t.reportNotePlaceholder}
            rows={2}
            maxLength={500}
            className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-400 bg-white"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={sikayetGonder} disabled={!sebep || gonderiyor}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40">
              {gonderiyor ? t.submittingBtn : t.reportSendBtn}
            </button>
            <button onClick={() => { setSikayetAcik(false); setHata(""); }} disabled={gonderiyor}
              className="px-4 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200">
              {t.cancelText}
            </button>
          </div>
        </div>
      )}

      {hata && <p className="ml-[42px] mt-2 text-xs text-red-600">{hata}</p>}
      {bilgi && <p className="ml-[42px] mt-2 text-xs text-green-700">{bilgi}</p>}

      {/* Eylemler */}
      {girisli && !cevapAcik && !sikayetAcik && (
        <div className="ml-[42px] mt-2 flex gap-3 text-xs">
          {sahibi && (
            <button onClick={() => { setCevapMetin(y.cevap ?? ""); setCevapAcik(true); setBilgi(""); }}
              className="font-semibold text-[#1a3a6b] hover:underline">
              💬 {y.cevap ? t.editReplyBtn : t.replyBtn}
            </button>
          )}
          {!kendiYorumu && (sikayetEdildi ? (
            <span className="text-gray-400">🚩 {t.reportedLabel}</span>
          ) : (
            <button onClick={() => { setSikayetAcik(true); setSebep(""); setAciklama(""); setBilgi(""); }}
              className="text-gray-400 hover:text-red-600 hover:underline">
              🚩 {t.reportBtn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
