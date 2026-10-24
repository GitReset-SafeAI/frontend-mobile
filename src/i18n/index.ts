import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enReporting from './locales/en/reporting.json';
import enSafety from './locales/en/safety.json';
import siCommon from './locales/si/common.json';
import siReporting from './locales/si/reporting.json';
import siSafety from './locales/si/safety.json';

const i18n = createInstance();

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { common: enCommon, reporting: enReporting, safety: enSafety },
      si: { common: siCommon, reporting: siReporting, safety: siSafety },
    },
    lng: getLocales()[0]?.languageCode === 'si' ? 'si' : 'en',
    supportedLngs: ['en', 'si'],
    fallbackLng: 'en',
    defaultNS: 'common',
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
