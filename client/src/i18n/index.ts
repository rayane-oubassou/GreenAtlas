import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en';
import ar from './locales/ar';
import darija from './locales/darija';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en:     { translation: en },
      ar:     { translation: ar },
      darija: { translation: darija },
    },
    fallbackLng: 'en',
    lng: localStorage.getItem('ga-lang') || 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage'], caches: [] },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('ga-lang', lng);
  const isRTL = lng === 'ar' || lng === 'darija';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

const isRTL = (i18n.language === 'ar' || i18n.language === 'darija');
document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language;

export default i18n;
