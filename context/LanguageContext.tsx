"use client";

import { createContext, ReactNode, useContext, useEffect, useSyncExternalStore } from "react";

export type Language = "vi" | "en";

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void };
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = "cryptocheck-language";
const LANGUAGE_CHANGE_EVENT = "cryptocheck-language-change";

function getStoredLanguage(): Language {
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return saved === "en" ? "en" : "vi";
}

function getServerLanguage(): Language {
  return "vi";
}

function subscribeToLanguage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribeToLanguage, getStoredLanguage, getServerLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const setLanguage = (next: Language) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  };
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export function translate(language: Language, vietnamese: string, english: string) {
  return language === "vi" ? vietnamese : english;
}

export function languageLocale(language: Language) {
  return language === "vi" ? "vi-VN" : "en-US";
}
