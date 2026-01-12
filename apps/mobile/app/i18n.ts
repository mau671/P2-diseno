import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import enUS from './locales/en-US/common.json';
import es419 from './locales/es-419/common.json';

const LANGUAGE_STORAGE_KEY = 'lng';

// Language detector for React Native
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // Fall back to device locale
      const deviceLocale = Localization.getLocales()[0];
      const languageTag = deviceLocale?.languageTag;

      // Map device locale to supported locales
      if (languageTag) {
        if (languageTag.startsWith('es')) {
          callback('es-419');
        } else if (languageTag.startsWith('en')) {
          callback('en-US');
        } else {
          callback('es-419'); // Default fallback
        }
      } else {
        callback('es-419');
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('es-419');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'es-419',
    supportedLngs: ['es-419', 'en-US'],
    ns: ['common'],
    defaultNS: 'common',
    resources: {
      'en-US': {
        common: enUS,
      },
      'es-419': {
        common: es419,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
