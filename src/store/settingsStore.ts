import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'react-native-localize';
import { UserSettings } from '../types';
import { apiService } from '../services/api';

interface SettingsState {
  language: 'en' | 'vi';
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  settings: UserSettings | null;
}

interface SettingsActions {
  setLanguage: (lang: 'en' | 'vi') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  syncWithBackend: (userId: string) => Promise<void>;
  loadSettings: (userId: string) => Promise<void>;
  updateSettings: (userId: string, newSettings: Partial<UserSettings>) => Promise<void>;
  initializeSettings: () => void;
  setLoading: (loading: boolean) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

const getDeviceLanguage = (): 'en' | 'vi' => {
  const locales = getLocales();
  const primaryLocale = locales[0];
  
  if (primaryLocale?.languageCode === 'vi') {
    return 'vi';
  }
  return 'en';
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // State
      language: 'en',
      theme: 'system',
      isLoading: false,
      settings: null,

      // Actions
      setLanguage: (lang: 'en' | 'vi') => {
        set({ language: lang });
      },

      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme });
      },

      syncWithBackend: async (userId: string) => {
        try {
          set({ isLoading: true });
          
          const { language, theme, settings } = get();
          
          const updatedSettings: Partial<UserSettings> = {
            language,
            theme,
            ...settings,
          };

          const response = await apiService.updateUserSettings(userId, updatedSettings);
          
          if (response.flag) {
            set({ 
              settings: response.data,
              isLoading: false 
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to sync settings with backend:', error);
          // Don't throw error here as it's not critical for app functionality
        }
      },

      loadSettings: async (userId: string) => {
        try {
          set({ isLoading: true });
          
          const response = await apiService.getUserSettings(userId);
          
          if (response.flag) {
            const backendSettings = response.data;
            
            set({
              language: backendSettings.language,
              theme: backendSettings.theme,
              settings: backendSettings,
              isLoading: false,
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to load settings from backend:', error);
          // Use local settings as fallback
        }
      },

      updateSettings: async (userId: string, newSettings: Partial<UserSettings>) => {
        try {
          set({ isLoading: true });
          
          const { settings } = get();
          const updatedSettings = { ...settings, ...newSettings };
          
          const response = await apiService.updateUserSettings(userId, updatedSettings);
          
          if (response.flag) {
            set({
              settings: response.data,
              language: response.data.language,
              theme: response.data.theme,
              isLoading: false,
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      initializeSettings: () => {
        const { language, theme } = get();
        
        // Set device language if not already set
        if (!language || language === 'en') {
          const deviceLang = getDeviceLanguage();
          set({ language: deviceLang });
        }
        
        // Initialize default settings if not exist
        if (!get().settings) {
          const defaultSettings: UserSettings = {
            language: language || getDeviceLanguage(),
            theme: theme || 'system',
            notifications: {
              push: true,
              email: true,
              sms: false,
            },
            privacy: {
              profileVisibility: 'public',
              showOnlineStatus: true,
            },
          };
          
          set({ settings: defaultSettings });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        settings: state.settings,
      }),
    }
  )
); 