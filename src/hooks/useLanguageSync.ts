import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { saveLanguagePreference } from '../utils/i18n';

export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const { userConfig } = useAuthStore();
  const { setLanguage } = useSettingsStore();

  useEffect(() => {
    if (userConfig?.language) {
      const currentLanguage = i18n.language;
      const userLanguage = userConfig.language;
      
      // Only change if different to avoid unnecessary re-renders
      if (currentLanguage !== userLanguage) {
        i18n.changeLanguage(userLanguage);
        setLanguage(userLanguage);
        // Save language preference for use after logout
        saveLanguagePreference(userLanguage);
      }
    }
  }, [userConfig?.language, i18n, setLanguage]);

  // Return current language for components that need it
  return {
    currentLanguage: userConfig?.language || 'en',
    isLanguageLoaded: !!userConfig?.language,
  };
}; 