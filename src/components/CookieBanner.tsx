"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const CONSENT_KEY = "cerez-onay";

export default function CookieBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] p-3 sm:p-4">
      <div className="max-w-4xl mx-auto bg-[#0f2548] text-white rounded-xl shadow-2xl border border-[#2554a0] flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 sm:px-5">
        <svg className="w-5 h-5 text-[#e8a020] flex-shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        </svg>
        <p className="text-xs sm:text-sm text-gray-200 flex-1 leading-relaxed">
          {t.cookieText}{" "}
          <Link href="/gizlilik-politikasi" className="text-[#e8a020] underline underline-offset-2 hover:text-yellow-300 transition-colors font-medium">
            {t.cookiePolicyLink}
          </Link>{t.cookieEnd}
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 bg-[#e8a020] hover:bg-[#c8851a] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          {t.acceptBtn}
        </button>
      </div>
    </div>
  );
}
