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
        try {
          set({ isLoading: true });
          
          const response = await apiService.login(credentials);
          
          if (response.flag) {
            const authData = response.data as AuthResponseDto;
            
            // Check if user is Collaborator (role: 3)
            if (authData.account.role !== 3) {
              throw new Error('Only Collaborators can access mobile app');
            }
            
            // Calculate token expiry times
            const accessTokenExpiresAt = calculateExpiryTime(AUTH_CONFIG.TOKEN_EXPIRE_TIME);
            const refreshTokenExpiresAt = calculateExpiryTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRE_TIME);
            
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
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout API
          await apiService.logout();
        } catch (error) {
          console.error('Logout API failed:', error);
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
          
          // Clear only auth storage, preserve language preference
          AsyncStorage.removeItem('auth-storage');
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
            const accessTokenExpiresAt = calculateExpiryTime(AUTH_CONFIG.TOKEN_EXPIRE_TIME);
            const refreshTokenExpiresAt = calculateExpiryTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRE_TIME);
            
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
          const { 
            accessToken, 
            refreshToken: storedRefreshToken, 
            accessTokenExpiresAt, 
            refreshTokenExpiresAt 
          } = get();
          
          // If no tokens, logout
          if (!accessToken || !storedRefreshToken) {
            set({ isAuthenticated: false });
            return;
          }

          // Check if refresh token is expired
          if (isTokenExpired(refreshTokenExpiresAt)) {
            console.log('Refresh token expired, logging out');
            get().logout();
            return;
          }

          // Check if access token is expired or expiring soon
          if (isTokenExpired(accessTokenExpiresAt) || isTokenExpiringSoon(accessTokenExpiresAt)) {
            console.log('Access token expired or expiring soon, refreshing...');
            try {
              await get().refreshAuthToken();
            } catch (error) {
              console.error('Token refresh failed:', error);
              get().logout();
              return;
            }
          } else {
            // Access token is still valid, just set it
            apiService.setAuthToken(accessToken);
            set({ isAuthenticated: true });
          }
        } catch (error) {
          console.error('Check auth status failed:', error);
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
            console.error('Auto token refresh failed:', error);
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