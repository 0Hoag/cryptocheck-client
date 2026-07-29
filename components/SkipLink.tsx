"use client";

import { translate, useLanguage } from "@/context/LanguageContext";

export default function SkipLink() {
  const { language } = useLanguage();

  return (
    <a href="#main-content" className="skip-link">
      {translate(language, "Chuyển đến nội dung chính", "Skip to main content")}
    </a>
  );
}
