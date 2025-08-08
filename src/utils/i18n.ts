import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../locales/en.json';
import vi from '../locales/vi.json';

const LANGUAGE_KEY = 'app_language';

// Get saved language from settings store instead of separate AsyncStorage
const getSavedLanguage = async (): Promise<string> => {
  try {
    // Try to get from settings store first
    const settingsData = await AsyncStorage.getItem('app-settings');
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      if (settings.state?.language) {
        return settings.state.language;
      }
    }
    
    // Fallback to old method
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }
    
    return 'en'; // Default to English now
  } catch (error) {
    console.error('Error getting saved language:', error);
    return 'en'; // Default to English
  }
};

// Save language preference - now syncs with settings store
export const saveLanguagePreference = async (language: string): Promise<void> => {
  try {
    // Update both storage methods for compatibility
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    
    // Also update settings store if it exists
    const settingsData = await AsyncStorage.getItem('app-settings');
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      settings.state = { ...settings.state, language };
      await AsyncStorage.setItem('app-settings', JSON.stringify(settings));
    }
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

// Initialize with English as default (more universal)
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Start with English as default
    fallbackLng: 'en', // Fall back to English
    debug: false, // Disable debug to reduce console logs
    
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

// Load saved language on app start - now called explicitly
export const initializeLanguage = async (): Promise<void> => {
  try {
    const savedLanguage = await getSavedLanguage();
    
    // Force change language regardless of current state
    await i18n.changeLanguage(savedLanguage);
    
    // Double-check the language was set correctly
    if (i18n.language !== savedLanguage) {
      // Force it again
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error initializing language:', error);
  }
};

export default i18n; 
