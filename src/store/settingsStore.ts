import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'react-native-localize';
import { UserConfig } from '../types';
import { apiService } from '../services/api';
import { mapUserConfigToBackend } from '../utils/userConfig';

// Type aliases for settings
type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'vi';

interface SettingsState {
  theme: Theme;
  language: Language;
  emailNotifications: boolean;
  pushNotifications: boolean;
  isLoading: boolean;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  resetToDefaults: () => void;
  syncWithUserConfig: (userConfig: UserConfig | null) => void;
  updateUserConfigApi: (accountId: string, newConfig: Partial<SettingsState>) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

const getDeviceLanguage = (): Language => {
  const locales = getLocales();
  const primaryLocale = locales[0];
  
  if (primaryLocale?.languageCode === 'vi') {
    return 'vi';
  }
  return 'en';
};

const defaultSettings: SettingsState = {
  theme: 'light',
  language: getDeviceLanguage(),
  emailNotifications: true,
  pushNotifications: true,
  isLoading: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Default state
      ...defaultSettings,

      // Actions
      setTheme: (theme: Theme) => {
        set({ theme });
      },

      setLanguage: (language: Language) => {
        set({ language });
      },

      setEmailNotifications: (emailNotifications: boolean) => {
        set({ emailNotifications });
      },

      setPushNotifications: (pushNotifications: boolean) => {
        set({ pushNotifications });
      },

      resetToDefaults: () => {
        set({
          theme: 'light',
          language: getDeviceLanguage(),
          emailNotifications: true,
          pushNotifications: true,
        });
      },

      // Sync settings with user config from backend (when login)
      syncWithUserConfig: (userConfig: UserConfig | null) => {
        if (userConfig) {
          const currentState = get();
          
          // Only sync from backend if user hasn't set local preferences
          // This preserves user's language choice if they changed it before login
          const hasLocalLanguagePreference = !!currentState.language;
          
          const newSettings = {
            theme: userConfig.theme,
            language: hasLocalLanguagePreference ? currentState.language : userConfig.language,
            emailNotifications: userConfig.receiveEmail,
            pushNotifications: userConfig.receiveNotify,
          };
          
          set(() => newSettings);
        }
      },

      // Update user config via API and sync locally
      updateUserConfigApi: async (accountId: string, newConfig: Partial<SettingsState>) => {
        const currentState = get();
        
        try {
          set({ isLoading: true });
          
          // Create the config to send to backend
          const backendConfig = mapUserConfigToBackend({
            userConfigId: '', // This will be handled by backend
            userId: accountId, // Use accountId as userId reference
            theme: newConfig.theme ?? currentState.theme,
            language: newConfig.language ?? currentState.language,
            receiveEmail: newConfig.emailNotifications ?? currentState.emailNotifications,
            receiveNotify: newConfig.pushNotifications ?? currentState.pushNotifications,
            updatedAt: new Date().toISOString(),
          });

          const response = await apiService.updateUserConfig(backendConfig);
          
          if (response.flag) {
            // Update successful, update local state
            set({
              ...newConfig,
              isLoading: false,
            });
          } else {
            // API failed, revert any optimistic updates
            set({ isLoading: false });
            throw new Error(response.message || 'Failed to update settings');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'app-settings',  // Persists independently from auth
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        emailNotifications: state.emailNotifications,
        pushNotifications: state.pushNotifications,
      }),
    }
  )
); 
