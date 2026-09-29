"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { translations, Lang, Translations } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "tr",
  t: translations.tr,
  setLang: () => {},
});

export function LanguageProvider({ children, initial }: { children: ReactNode; initial: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const router = useRouter();

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `lang=${l};path=/;max-age=31536000`;
    router.refresh();
  }, [router]);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang] as Translations, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
