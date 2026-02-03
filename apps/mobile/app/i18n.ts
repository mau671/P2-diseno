import * as i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import enUS from "./locales/en-US/common.json";
import es419 from "./locales/es-419/common.json";

const LANGUAGE_STORAGE_KEY = "lng";
const isServer = typeof window === "undefined";

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  init: () => {},

  detect: async (callback: (lng: string) => void) => {
    try {
      if (isServer) {
        callback("es-419");
        return;
      }

      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved) {
        callback(saved);
        return;
      }

      const locales = Localization.getLocales();
      const deviceTag = locales?.[0]?.languageTag || "";

      if (deviceTag.startsWith("es")) callback("es-419");
      else if (deviceTag.startsWith("en")) callback("en-US");
      else callback("es-419");
    } catch (e) {
      console.error("Error detecting language:", e);
      callback("es-419");
    }
  },

  cacheUserLanguage: async (lng: string) => {
    try {
      if (isServer) return;
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch (e) {
      console.error("Error caching language:", e);
    }
  },
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    fallbackLng: "es-419",
    supportedLngs: ["es-419", "en-US"],
    ns: ["common"],
    defaultNS: "common",
    resources: {
      "en-US": { common: enUS as any },
      "es-419": { common: es419 as any }
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

export default i18n;
