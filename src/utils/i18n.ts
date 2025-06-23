import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';

// Import translation files
import en from '../locales/en.json';
import vi from '../locales/vi.json';

const getDeviceLanguage = (): string => {
  const locales = getLocales();
  const primaryLocale = locales[0];
  
  if (primaryLocale?.languageCode === 'vi') {
    return 'vi';
  }
  return 'en';
};

const resources = {
  en: {
    translation: en,
  },
  vi: {
    translation: vi,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(), // Default language based on device
    fallbackLng: 'en',
    debug: __DEV__, // Enable debug in development
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Enable namespace and default namespace
    defaultNS: 'translation',
    ns: ['translation'],
    
    // React i18next options
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
    
    // Cache options
    load: 'languageOnly', // Load only language (no region)
    cleanCode: true, // Clean language code
    
    // Compatibility
    compatibilityJSON: 'v4',
  });

export default i18n; 