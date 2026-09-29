"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Yorum {
  id: number;
  kullanici_ad: string;
  yorum: string;
  puan: number;
  created_at: string;
}

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
  const [basarili, setBasarili] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  const fetchYorumlar = useCallback(async () => {
    setYukleniyor(true);
    const res = await fetch(`/api/yorumlar?firmaId=${firmaId}`);
    if (res.ok) {
      const data = await res.json();
      setYorumlar(data.yorumlar || []);
      setStats(data.stats);
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

    const res = await fetch("/api/yorum-ekle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firma_id: firmaId, yorum: yorumMetin, puan }),
    });
    const data = await res.json();

    if (res.ok) {
      setBasarili(true);
      setYorumMetin("");
      setPuan(0);
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
        {basarili ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm font-medium flex items-center gap-2">
            {t.reviewAdded}
          </div>
        ) : user ? (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">{t.addReviewTitle}</h3>
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
            <button
              onClick={handleGonder}
              disabled={gonderiyor}
              className="mt-3 bg-[#1a3a6b] hover:bg-[#2554a0] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {gonderiyor ? t.submittingBtn : t.submitReviewBtn}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {t.loginToReview}{" "}
            <button
              onClick={handleGoogleGiris}
              className="text-[#1a3a6b] font-semibold underline underline-offset-2 hover:text-[#2554a0] transition-colors cursor-pointer"
            >
              {t.loginToReviewLink}
            </button>{t.loginToReviewEnd}
          </p>
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
