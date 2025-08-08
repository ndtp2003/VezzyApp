import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { saveLanguagePreference } from '../utils/i18n';

export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const { userConfig } = useAuthStore();
  const { language: settingsLanguage, setLanguage } = useSettingsStore();

  useEffect(() => {
    // Only sync if i18n is ready (language has been initialized)
    if (!i18n.isInitialized) {
      return;
    }

    // Priority: userConfig > settingsStore > i18n current
    let targetLanguage = 'en'; // Default to English
    
    if (userConfig?.language) {
      targetLanguage = userConfig.language;
    } else if (settingsLanguage) {
      targetLanguage = settingsLanguage;
    }
    
    // Only change if different to avoid unnecessary re-renders
    if (targetLanguage !== i18n.language) {
      i18n.changeLanguage(targetLanguage);
      
      // Update settings store if it's from userConfig
      if (userConfig?.language && userConfig.language !== settingsLanguage) {
        setLanguage(userConfig.language);
        saveLanguagePreference(userConfig.language);
      }
    }
  }, [userConfig?.language, settingsLanguage, i18n, setLanguage]);

  // Sync settings store language changes to i18n
  useEffect(() => {
    if (!i18n.isInitialized) {
      return;
    }

    if (settingsLanguage && settingsLanguage !== i18n.language) {
      i18n.changeLanguage(settingsLanguage);
      saveLanguagePreference(settingsLanguage);
    }
  }, [settingsLanguage, i18n]);

  // Return current language for components that need it
  return {
    currentLanguage: userConfig?.language || settingsLanguage || 'en',
    isLanguageLoaded: !!(userConfig?.language || settingsLanguage),
  };
}; 

