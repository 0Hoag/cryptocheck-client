"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type Language = "vi" | "en";

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void };
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");
  useEffect(() => {
    const saved = window.localStorage.getItem("cryptocheck-language");
    if (saved === "vi" || saved === "en") setLanguageState(saved);
  }, []);
  const setLanguage = (next: Language) => { setLanguageState(next); window.localStorage.setItem("cryptocheck-language", next); };
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
