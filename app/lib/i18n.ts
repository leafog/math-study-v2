import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zh from "~/locales/zh/translation.json";
import en from "~/locales/en/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    fallbackLng: "zh",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

// 注册 datetime formatter，配合 translation 中的 {{val, datetime}} 使用
i18n.services.formatter?.add("datetime", (value, lng, options) => {
  return new Intl.DateTimeFormat(lng, options).format(value as Date);
});

export default i18n;
