import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import enAccount from './locales/en/account.json';
import enCommon from './locales/en/common.json';
import enEmergency from './locales/en/emergency.json';
import enIncidentAi from './locales/en/incidentAi.json';
import enReporting from './locales/en/reporting.json';
import enSafety from './locales/en/safety.json';
import siAccount from './locales/si/account.json';
import siCommon from './locales/si/common.json';
import siEmergency from './locales/si/emergency.json';
import siIncidentAi from './locales/si/incidentAi.json';
import siReporting from './locales/si/reporting.json';
import siSafety from './locales/si/safety.json';
import taAccount from './locales/ta/account.json';
import taCommon from './locales/ta/common.json';
import taEmergency from './locales/ta/emergency.json';
import taIncidentAi from './locales/ta/incidentAi.json';
import taReporting from './locales/ta/reporting.json';
import taSafety from './locales/ta/safety.json';

export const supportedLanguages = ['en', 'si', 'ta'] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

// Each language is named in itself, so it can be found even when the current language is unreadable.
export const languageNames: Record<AppLanguage, string> = { en: 'English', si: 'සිංහල', ta: 'தமிழ்' };

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return supportedLanguages.some((language) => language === value);
}

const deviceLanguage = getLocales()[0]?.languageCode;
const i18n = createInstance();

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { account: enAccount, common: enCommon, emergency: enEmergency, incidentAi: enIncidentAi, reporting: enReporting, safety: enSafety },
      si: { account: siAccount, common: siCommon, emergency: siEmergency, incidentAi: siIncidentAi, reporting: siReporting, safety: siSafety },
      ta: { account: taAccount, common: taCommon, emergency: taEmergency, incidentAi: taIncidentAi, reporting: taReporting, safety: taSafety },
    },
    lng: isAppLanguage(deviceLanguage) ? deviceLanguage : 'en',
    supportedLngs: [...supportedLanguages],
    fallbackLng: 'en',
    defaultNS: 'common',
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
