import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CombinedUserData, UserConfig, LoginRequest, AuthResponseDto, TokenInfo, Role, Gender } from '../types';
import { apiService } from '../services/api';
import { AUTH_CONFIG } from '../utils/config';
import { mapUserConfigFromBackend } from '../utils/userConfig';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  user: CombinedUserData | null;
  userConfig: UserConfig | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  updateUser: (user: Partial<CombinedUserData>) => void;
  updateUserConfig: (config: Partial<UserConfig>) => void;
  setLoading: (loading: boolean) => void;
  checkAuthStatus: () => Promise<void>;
  ensureValidToken: () => Promise<boolean>;
}

export type AuthStore = AuthState & AuthActions;

// Helper functions for token management
const calculateExpiryTime = (expiresInSeconds: number): number => {
  return Date.now() + (expiresInSeconds * 1000);
};

// Calculate expiry using config values (backend doesn't provide expiry times)
const calculateTokenExpiry = (): { accessTokenExpiresAt: number, refreshTokenExpiresAt: number } => {
  return {
    accessTokenExpiresAt: calculateExpiryTime(AUTH_CONFIG.TOKEN_EXPIRE_TIME),
    refreshTokenExpiresAt: calculateExpiryTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRE_TIME),
  };
};

const isTokenExpired = (expiresAt: number | null): boolean => {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
};

const isTokenExpiringSoon = (expiresAt: number | null, bufferMinutes: number = 5): boolean => {
  if (!expiresAt) return true;
  const bufferMs = bufferMinutes * 60 * 1000;
  return Date.now() >= (expiresAt - bufferMs);
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      user: null,
      userConfig: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (credentials: LoginRequest) => {
        const { useLoadingStore } = await import('./loadingStore');
        const loadingStore = useLoadingStore.getState();
        
        // Import translation
        const { useTranslation } = await import('react-i18next');
        
        try {
          set({ isLoading: true });
          loadingStore.showLoading('Authenticating...');
          
          const response = await apiService.login(credentials);
          if (response.flag) {
            const authData = response.data as AuthResponseDto;
            
            // Check if user is Collaborator (role: 3) - CLIENT-SIDE VALIDATION
            if (authData.account.role !== 3) {
              // Set loading to false before throwing error
              set({ isLoading: false });
              loadingStore.hideLoading();
              throw new Error('WRONG_ROLE');
            }
            
            // Calculate token expiry times
            const { accessTokenExpiresAt, refreshTokenExpiresAt } = calculateTokenExpiry();
            
            // Map response data to CombinedUserData interface
            const user: CombinedUserData = {
              // Account fields
              accountId: authData.account.accountId,
              username: authData.account.username,
              email: authData.account.email,
              role: authData.account.role as Role,
              isActive: authData.account.isActive,
              isEmailVerified: authData.account.isEmailVerified,
              isOnline: authData.account.isOnline,
              lastActiveAt: authData.account.lastActiveAt,
              lastLoginDevice: authData.account.lastLoginDevice,
              lastLoginIP: authData.account.lastLoginIP,
              lastLoginLocation: authData.account.lastLoginLocation,
              accountCreatedAt: authData.account.createdAt,
              lastLogin: authData.account.lastLogin,
              
              // User fields
              userId: authData.account.userId,
              fullName: (authData.account as any).fullName || null, // Use actual fullName from backend
              phone: authData.account.phone,
              avatarUrl: authData.account.avatar,
              gender: authData.account.gender as Gender,
              dob: authData.account.dob,
              location: authData.account.location,
            };
            
            // Map userConfig from backend format (userConfig is nested in account)
            const userConfig = mapUserConfigFromBackend((authData.account as any).userConfig, authData.account.accountId);
            
            set({
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken,
              accessTokenExpiresAt,
              refreshTokenExpiresAt,
              user,
              userConfig,
              isAuthenticated: true,
              isLoading: false,
            });

            // Set token for future API calls
            apiService.setAuthToken(authData.accessToken);
            
            // Sync userConfig with settingsStore
            const { useSettingsStore } = await import('./settingsStore');
            const settingsStore = useSettingsStore.getState();
            settingsStore.syncWithUserConfig(userConfig);
            
            // Auto-fetch notifications sau khi login thành công
            try {
              const { initializeNotifications } = await import('./notificationStore');
              // Run in background, don't wait for completion
              initializeNotifications().catch(() => {
                // Silent failure
              });
            } catch (error) {
              // Silent failure
            }
          } else {
            // Handle backend ApiResponse errors - BACKEND VALIDATION
            let errorKey = 'LOGIN_ERROR';
            
            // First check response.code (status code from backend ApiResponse)
            switch (response.code) {
              case 401:
                errorKey = 'INVALID_CREDENTIALS';
                break;
              case 403:
                // Check if it's role-related error
                if (response.message?.includes('role') || response.message?.includes('collaborator') || response.message?.includes('access denied')) {
                  errorKey = 'WRONG_ROLE';
                } else if (response.message?.includes('Account is not active')) {
                  errorKey = 'ACCOUNT_NOT_ACTIVE';
                } else if (response.message?.includes('Email is not verified')) {
                  errorKey = 'EMAIL_NOT_VERIFIED';
                } else {
                  errorKey = 'UNAUTHORIZED';
                }
                break;
              case 404:
                errorKey = 'USER_PROFILE_NOT_FOUND';
                break;
              case 500:
                errorKey = 'SERVER_ERROR';
                break;
              default:
                // Fall back to checking message content
                if (response.message?.includes('Invalid username or password')) {
                  errorKey = 'INVALID_CREDENTIALS';
                } else if (response.message?.includes('role') || response.message?.includes('collaborator') || response.message?.includes('access denied')) {
                  errorKey = 'WRONG_ROLE';
                } else if (response.message?.includes('Account is not active')) {
                  errorKey = 'ACCOUNT_NOT_ACTIVE';
                } else if (response.message?.includes('Email is not verified')) {
                  errorKey = 'EMAIL_NOT_VERIFIED';
                } else if (response.message?.includes('User profile not found')) {
                  errorKey = 'USER_PROFILE_NOT_FOUND';
                } else if (response.message?.includes('Server error')) {
                  errorKey = 'SERVER_ERROR';
                }
                break;
            }
            
            throw new Error(errorKey);
          }
        } catch (error: any) {
          set({ isLoading: false });
          
          // Handle our custom error types first (from role check or backend response)
          if (error.message === 'WRONG_ROLE') {
            throw error;
          }
          
          if (error.message === 'INVALID_CREDENTIALS' ||
              error.message === 'ACCOUNT_NOT_ACTIVE' ||
              error.message === 'EMAIL_NOT_VERIFIED' ||
              error.message === 'USER_PROFILE_NOT_FOUND' ||
              error.message === 'LOGIN_ERROR' ||
              error.message === 'SERVER_ERROR') {
            throw error;
          }
          
          // Handle HTTP status codes as fallback (for actual network errors)
          if (error?.response?.status === 401) {
            throw new Error('INVALID_CREDENTIALS');
          } else if (error?.response?.status === 403) {
            throw new Error('UNAUTHORIZED');
          } else if (error?.response?.status === 404) {
            throw new Error('USER_PROFILE_NOT_FOUND');
          } else if (error?.response?.status >= 500) {
            throw new Error('SERVER_ERROR');
          } else if (!error?.response) {
            // Network connection error
            throw new Error('NETWORK_ERROR');
          }
          
          // Default error
          throw new Error('LOGIN_ERROR');
        } finally {
          loadingStore.hideLoading();
        }
      },

      logout: async () => {
        try {
          // Call logout API
          await apiService.logout();
        } catch (error) {
          // Silent failure - user will still be logged out locally
        } finally {
          set({
            accessToken: null,
            refreshToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            user: null,
            userConfig: null,
            isAuthenticated: false,
          });
          
          // Clear token from API service
          apiService.setAuthToken(null);
          
          // Clear only auth storage, preserve app settings (theme/language)
          AsyncStorage.removeItem('auth-storage');
          
          // Clear notification store
          try {
            const notificationStore = require('./notificationStore').useNotificationStore.getState();
            notificationStore.reset();
          } catch (error) {
            // Silently handle notification store clear error
          }
          
          // Note: app-settings storage (theme/language) is preserved automatically
          // This allows users to keep their preferred theme and language after logout
        }
      },

      refreshAuthToken: async () => {
        try {
          const { refreshToken: currentRefreshToken } = get();
          if (!currentRefreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await apiService.refreshToken({ refreshToken: currentRefreshToken });
          
          if (response.flag) {
            const authData = response.data as AuthResponseDto;
            
            // Calculate new token expiry times
            const { accessTokenExpiresAt, refreshTokenExpiresAt } = calculateTokenExpiry();
            
            // Map response data to CombinedUserData interface
            const user: CombinedUserData = {
              // Account fields
              accountId: authData.account.accountId,
              username: authData.account.username,
              email: authData.account.email,
              role: authData.account.role as Role,
              isActive: authData.account.isActive,
              isEmailVerified: authData.account.isEmailVerified,
              isOnline: authData.account.isOnline,
              lastActiveAt: authData.account.lastActiveAt,
              lastLoginDevice: authData.account.lastLoginDevice,
              lastLoginIP: authData.account.lastLoginIP,
              lastLoginLocation: authData.account.lastLoginLocation,
              accountCreatedAt: authData.account.createdAt,
              lastLogin: authData.account.lastLogin,
              
              // User fields
              userId: authData.account.userId,
              fullName: (authData.account as any).fullName || null, // Use actual fullName from backend
              phone: authData.account.phone,
              avatarUrl: authData.account.avatar,
              gender: authData.account.gender as Gender,
              dob: authData.account.dob,
              location: authData.account.location,
            };
            
            // Map userConfig from backend format (userConfig is nested in account)
            const userConfig = mapUserConfigFromBackend((authData.account as any).userConfig, authData.account.accountId);
            
            set({
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken,
              accessTokenExpiresAt,
              refreshTokenExpiresAt,
              user,
              userConfig,
              isAuthenticated: true,
            });

            apiService.setAuthToken(authData.accessToken);
            
            // Auto-fetch notifications sau khi refresh token thành công
            try {
              const { initializeNotifications } = await import('./notificationStore');
              // Run in background, don't wait for completion
              initializeNotifications().catch(() => {
                // Silent failure
              });
            } catch (error) {
              // Silent failure
            }
          } else {
            // Token refresh failed, logout user
            get().logout();
            throw new Error(response.message);
          }
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      updateUser: (userData: Partial<CombinedUserData>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      updateUserConfig: (configData: Partial<UserConfig>) => {
        const { userConfig } = get();
        if (userConfig) {
          set({
            userConfig: { ...userConfig, ...configData },
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      checkAuthStatus: async () => {
        try {
          const state = get();
          const { 
            accessToken, 
            refreshToken: storedRefreshToken, 
            accessTokenExpiresAt, 
            refreshTokenExpiresAt,
            isAuthenticated,
            user
          } = state;
          
                    // Check auth state consistency
          
          // If no tokens, set isAuthenticated to false
          if (!accessToken || !storedRefreshToken) {
            set({ isAuthenticated: false });
            return;
          }

          // Check if refresh token is expired
          if (isTokenExpired(refreshTokenExpiresAt)) {
            get().logout();
            return;
          }

          // Check if access token is expired or expiring soon
          if (isTokenExpired(accessTokenExpiresAt) || isTokenExpiringSoon(accessTokenExpiresAt)) {
            try {
              await get().refreshAuthToken();
            } catch (error) {
              get().logout();
              return;
            }
          } else {
            // Access token is still valid, just set it
            apiService.setAuthToken(accessToken);
            set({ isAuthenticated: true });
            
            // Auto-fetch notifications nếu user đã authenticated với token hợp lệ
            try {
              const { initializeNotifications } = await import('./notificationStore');
              // Run in background, don't wait for completion
              initializeNotifications().catch(() => {
                // Silent failure
              });
            } catch (error) {
              // Silent failure
            }
          }
        } catch (error) {
          get().logout();
        }
      },

      // New method to check and auto-refresh token before API calls
      ensureValidToken: async (): Promise<boolean> => {
        const { 
          accessToken, 
          accessTokenExpiresAt, 
          refreshTokenExpiresAt 
        } = get();

        // If no access token, return false
        if (!accessToken) {
          return false;
        }

        // Check if refresh token is expired
        if (isTokenExpired(refreshTokenExpiresAt)) {
          get().logout();
          return false;
        }

        // Check if access token needs refresh
        if (isTokenExpiringSoon(accessTokenExpiresAt, 2)) { // 2 minutes buffer
          try {
            await get().refreshAuthToken();
            return true;
          } catch (error) {
            get().logout();
            return false;
          }
        }

        return true;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        refreshTokenExpiresAt: state.refreshTokenExpiresAt,
        user: state.user,
        userConfig: state.userConfig,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 
