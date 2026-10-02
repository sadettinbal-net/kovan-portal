"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Yorum {
  id: number;
  kullanici_ad: string;
  yorum: string;
  puan: number;
  created_at: string;
  guncelleme_tarihi: string | null;
}

type BenimYorum = Yorum & { gizli: boolean };

interface Stats {
  toplam: number;
  olumlu: number;
  olumlu_yuzde: number | null;
  ortalama_puan: number | null;
}


function Yildizlar({
  puan,
  boyut = "md",
}: {
  puan: number;
  boyut?: "sm" | "md" | "lg";
}) {
  const cls =
    boyut === "lg" ? "text-xl" : boyut === "sm" ? "text-sm leading-none" : "text-base";
  return (
    <span className={cls} aria-label={`${puan} yıldız`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= puan ? "text-yellow-400" : "text-gray-300"}>
          {i <= puan ? "⭐" : "☆"}
        </span>
      ))}
    </span>
  );
}

export default function YorumBolumu({ firmaId }: { firmaId: number }) {
  const { t } = useLanguage();
  const [yorumlar, setYorumlar] = useState<Yorum[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [puan, setPuan] = useState(0);
  const [hoverPuan, setHoverPuan] = useState(0);
  const [yorumMetin, setYorumMetin] = useState("");
  const [gonderiyor, setGonderiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [benim, setBenim] = useState<BenimYorum | null>(null);
  const [sahibi, setSahibi] = useState(false);
  const [duzenleniyor, setDuzenleniyor] = useState(false);
  const [silOnay, setSilOnay] = useState(false);

  const fetchYorumlar = useCallback(async () => {
    setYukleniyor(true);
    const res = await fetch(`/api/yorumlar?firmaId=${firmaId}`);
    if (res.ok) {
      const data = await res.json();
      setYorumlar(data.yorumlar || []);
      setStats(data.stats);
      setBenim(data.benim);
      setSahibi(!!data.sahibi);
    }
    setYukleniyor(false);
  }, [firmaId]);

  useEffect(() => {
    fetchYorumlar();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, [fetchYorumlar]);

  const handleGonder = async () => {
    if (puan === 0) { setHata(t.ratingRequired); return; }
    if (yorumMetin.trim() && yorumMetin.trim().length < 10) { setHata(t.reviewTooShort); return; }

    setGonderiyor(true);
    setHata("");
    setBilgi("");

    const res = await fetch("/api/yorum", {
      method: duzenleniyor ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firma_id: firmaId, yorum: yorumMetin, puan }),
    });
    const data = await res.json();

    if (res.ok) {
      setBilgi(duzenleniyor ? t.reviewUpdated : t.reviewAdded);
      setDuzenleniyor(false);
      setYorumMetin("");
      setPuan(0);
      fetchYorumlar();
    } else {
      setHata(data.error || t.reviewError);
    }
    setGonderiyor(false);
  };

  const duzenlemeyiBaslat = () => {
    if (!benim) return;
    setPuan(benim.puan);
    setYorumMetin(benim.yorum);
    setHata("");
    setBilgi("");
    setDuzenleniyor(true);
  };

  const duzenlemeyiBirak = () => {
    setDuzenleniyor(false);
    setPuan(0);
    setYorumMetin("");
    setHata("");
  };

  const handleSil = async () => {
    setGonderiyor(true);
    setHata("");
    const res = await fetch("/api/yorum", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firma_id: firmaId }),
    });
    const data = await res.json();
    if (res.ok) {
      setBilgi(t.reviewDeleted);
      setSilOnay(false);
      fetchYorumlar();
    } else {
      setHata(data.error || t.reviewError);
    }
    setGonderiyor(false);
  };

  const gosterPuan = hoverPuan || puan;

  const handleGoogleGiris = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="mt-6 bg-white rounded-xl border border-[#dde3ec] overflow-hidden shadow-sm">
      {/* Başlık */}
      <div className="px-6 py-4 border-b border-[#dde3ec] bg-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-[#1a3a6b] text-lg">{t.reviewsTitle}</h2>
        {stats && stats.toplam > 0 && (
          <span className="text-sm text-gray-500">{t.reviewsCount(stats.toplam)}</span>
        )}
      </div>

      {/* Özet istatistik */}
      {stats && stats.toplam > 0 && (
        <div className="px-6 py-4 border-b border-[#dde3ec] bg-blue-50 flex flex-wrap items-center gap-6">
          <div className="text-center min-w-[60px]">
            <div className="text-3xl font-black text-[#1a3a6b]">{stats.ortalama_puan}</div>
            <Yildizlar puan={Math.round(stats.ortalama_puan || 0)} boyut="sm" />
            <div className="text-[10px] text-gray-400 mt-0.5">{t.averageLabel}</div>
          </div>

          <div className="flex-1 min-w-[140px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-700">{t.positiveRate}</span>
              <span
                className={`text-sm font-bold ${
                  (stats.olumlu_yuzde || 0) >= 75 ? "text-green-600" : "text-gray-500"
                }`}
              >
                %{stats.olumlu_yuzde ?? 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  (stats.olumlu_yuzde || 0) >= 90
                    ? "bg-green-500"
                    : (stats.olumlu_yuzde || 0) >= 75
                    ? "bg-lime-500"
                    : "bg-yellow-400"
                }`}
                style={{ width: `${stats.olumlu_yuzde ?? 0}%` }}
              />
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {t.positiveStats(stats.olumlu, stats.toplam)}
            </div>
          </div>

          {(stats.olumlu_yuzde || 0) >= 90 && (
            <div className="bg-[#e8a020] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              {t.highlyRated}
            </div>
          )}
          {(stats.olumlu_yuzde || 0) >= 75 && (stats.olumlu_yuzde || 0) < 90 && (
            <div className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {t.highScore}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <div className="px-6 py-5 border-b border-[#dde3ec]">
        {bilgi && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-green-700 text-sm font-medium">
            {bilgi}
          </div>
        )}
        {!user ? (
          <p className="text-sm text-gray-500">
            {t.loginToReview}{" "}
            <button
              onClick={handleGoogleGiris}
              className="text-[#1a3a6b] font-semibold underline underline-offset-2 hover:text-[#2554a0] transition-colors cursor-pointer"
            >
              {t.loginToReviewLink}
            </button>{t.loginToReviewEnd}
          </p>
        ) : yukleniyor ? (
          <p className="text-sm text-gray-400">{t.loadingText}</p>
        ) : sahibi ? (
          <p className="text-sm text-gray-500">{t.ownFirmNoReview}</p>
        ) : benim && !duzenleniyor ? (
          <div className={`rounded-lg border p-4 ${benim.gizli ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-100"}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-700 text-sm">{t.yourReviewTitle}</h3>
              <span className="text-xs text-gray-400">
                {new Date(benim.created_at).toLocaleDateString(t.memberSinceDateLocale)}
                {benim.guncelleme_tarihi && ` · ${t.editedLabel}`}
              </span>
            </div>
            <Yildizlar puan={benim.puan} boyut="sm" />
            {benim.yorum && <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{benim.yorum}</p>}
            {benim.gizli && <p className="text-xs text-gray-500 mt-2">🙈 {t.reviewHiddenNote}</p>}
            {hata && <p className="text-red-500 text-xs mt-2">{hata}</p>}
            {silOnay ? (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-sm text-gray-700">{t.deleteReviewConfirm}</span>
                <button onClick={handleSil} disabled={gonderiyor}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                  {gonderiyor ? t.deletingText : t.deleteReviewBtn}
                </button>
                <button onClick={() => setSilOnay(false)} disabled={gonderiyor}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg">
                  {t.cancelText}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button onClick={duzenlemeyiBaslat}
                  className="px-3 py-1.5 bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-xs font-semibold rounded-lg">
                  ✏️ {t.editReviewBtn}
                </button>
                <button onClick={() => { setSilOnay(true); setBilgi(""); }}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg">
                  🗑️ {t.deleteReviewBtn}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">{duzenleniyor ? t.yourReviewTitle : t.addReviewTitle}</h3>
            <div className="flex items-center gap-1 mb-4">
              <span className="text-sm text-gray-500 mr-1">{t.yourRating}</span>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPuan(i)}
                  onMouseEnter={() => setHoverPuan(i)}
                  onMouseLeave={() => setHoverPuan(0)}
                  className="text-2xl transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`${i} yıldız`}
                >
                  <span className={i <= gosterPuan ? "text-yellow-400" : "text-gray-300"}>
                    {i <= gosterPuan ? "⭐" : "☆"}
                  </span>
                </button>
              ))}
              {gosterPuan > 0 && (
                <span className="ml-2 text-sm font-medium text-gray-500">
                  {t.ratingLabels[gosterPuan]}
                </span>
              )}
            </div>
            <textarea
              value={yorumMetin}
              onChange={(e) => setYorumMetin(e.target.value)}
              placeholder={t.reviewPlaceholder}
              className="w-full border border-[#dde3ec] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#1a3a6b] transition-colors"
              rows={3}
            />
            {hata && <p className="text-red-500 text-xs mt-1.5">{hata}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleGonder}
                disabled={gonderiyor}
                className="bg-[#1a3a6b] hover:bg-[#2554a0] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {gonderiyor ? t.submittingBtn : duzenleniyor ? t.saveReviewBtn : t.submitReviewBtn}
              </button>
              {duzenleniyor && (
                <button
                  onClick={duzenlemeyiBirak}
                  disabled={gonderiyor}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                >
                  {t.cancelText}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Yorum listesi */}
      <div className="divide-y divide-[#f0f3f8]">
        {yukleniyor ? (
          <div className="px-6 py-5 text-sm text-gray-400">{t.loadingText}</div>
        ) : yorumlar.length === 0 ? (
          <div className="px-6 py-5 text-sm text-gray-400 text-center">
            {t.noReviews}
          </div>
        ) : (
          yorumlar.map((y) => (
            <div key={y.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1a3a6b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {y.kullanici_ad.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-800 leading-tight">
                      {y.kullanici_ad}
                    </div>
                    <Yildizlar puan={y.puan} boyut="sm" />
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 pt-1">
                  {new Date(y.created_at).toLocaleDateString(t.memberSinceDateLocale)}
                  {y.guncelleme_tarihi && ` · ${t.editedLabel}`}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pl-[42px]">{y.yorum}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
