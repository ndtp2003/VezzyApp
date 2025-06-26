import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../locales/en.json';
import vi from '../locales/vi.json';

const LANGUAGE_KEY = 'app_language';

// Get saved language or default to Vietnamese
const getSavedLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'vi'; // Default to Vietnamese
  } catch {
    return 'vi';
  }
};

// Save language preference
export const saveLanguagePreference = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
};

const resources = {
  en: {
    translation: en,
  },
  vi: {
    translation: vi,
  },
};

// Initialize with Vietnamese as default (suitable for Vietnamese users)
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // Start with Vietnamese as default
    fallbackLng: 'vi', // Fall back to Vietnamese
    debug: __DEV__, // Enable debug in development
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Enable returnObjects to fix warning when accessing nested objects
    returnObjects: true,
    
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

// Load saved language on app start
export const initializeLanguage = async (): Promise<void> => {
  const savedLanguage = await getSavedLanguage();
  if (savedLanguage !== i18n.language) {
    await i18n.changeLanguage(savedLanguage);
  }
};

// Initialize language immediately
initializeLanguage();

export default i18n; 
