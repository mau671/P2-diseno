import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en-US/common.json";
import esCommon from "./locales/es-419/common.json";
import ptCommon from "./locales/pt-BR/common.json";
import frCommon from "./locales/fr-FR/common.json";
import itCommon from "./locales/it-IT/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es-419",
    supportedLngs: ["es-419", "en-US", "pt-BR", "fr-FR", "it-IT"],
    ns: ["common"],
    defaultNS: "common",
    resources: {
      "en-US": { common: enCommon },
      "es-419": { common: esCommon },
      "pt-BR": { common: ptCommon },
      "fr-FR": { common: frCommon },
      "it-IT": { common: itCommon },
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lng",
      lookupLocalStorage: "lng",
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

// Make i18n available globally for debugging
if (typeof window !== "undefined") {
  (window as typeof window & { i18n: typeof i18n }).i18n = i18n;
}

export default i18n;
