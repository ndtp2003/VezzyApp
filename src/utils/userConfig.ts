// Language mapping utilities
export const languageMapping = {
  // Backend enum to frontend string
  fromBackend: (backendLanguage: number): 'en' | 'vi' => {
    switch (backendLanguage) {
      case 0: return 'en'; // Default = English
      case 1: return 'vi'; // Vie = Vietnamese  
      case 2: return 'en'; // Eng = English
      default: return 'en';
    }
  },
  
  // Frontend string to backend enum
  toBackend: (frontendLanguage: 'en' | 'vi'): number => {
    switch (frontendLanguage) {
      case 'en': return 2; // Eng
      case 'vi': return 1; // Vie
      default: return 2;
    }
  }
};

// Theme mapping utilities
export const themeMapping = {
  // Backend enum to frontend string
  fromBackend: (backendTheme: number): 'light' | 'dark' | 'system' => {
    switch (backendTheme) {
      case 0: return 'light'; // Default = Light
      case 1: return 'light'; // Light
      case 2: return 'dark'; // Dark
      default: return 'light';
    }
  },
  
  // Frontend string to backend enum
  toBackend: (frontendTheme: 'light' | 'dark' | 'system'): number => {
    switch (frontendTheme) {
      case 'light': return 1; // Light
      case 'dark': return 2; // Dark
      case 'system': return 1; // Default to Light (backend doesn't have System)
      default: return 1;
    }
  }
};

// Helper to convert backend UserConfig to frontend format (for login response)
export const mapUserConfigFromBackend = (backendConfig: {
  language: number;
  theme: number;
  receiveEmail: boolean;
  receiveNotify: boolean;
}, accountId?: string) => ({
  userConfigId: '', // Will be set when we fetch full config later
  userId: accountId || '',
  language: languageMapping.fromBackend(backendConfig.language),
  theme: themeMapping.fromBackend(backendConfig.theme),
  receiveEmail: backendConfig.receiveEmail,
  receiveNotify: backendConfig.receiveNotify,
  customOptions: null,
  updatedAt: new Date().toISOString(),
});

// Helper to convert frontend UserConfig to backend format
export const mapUserConfigToBackend = (frontendConfig: {
  userConfigId: string;
  userId: string;
  language: 'en' | 'vi';
  theme: 'light' | 'dark' | 'system';
  receiveEmail: boolean;
  receiveNotify: boolean;
  customOptions?: any;
  updatedAt: string;
}) => ({
  userConfigId: frontendConfig.userConfigId,
  userId: frontendConfig.userId,
  language: languageMapping.toBackend(frontendConfig.language),
  theme: themeMapping.toBackend(frontendConfig.theme),
  receiveEmail: frontendConfig.receiveEmail,
  receiveNotify: frontendConfig.receiveNotify,
  customOptions: frontendConfig.customOptions,
  updatedAt: frontendConfig.updatedAt,
}); 
