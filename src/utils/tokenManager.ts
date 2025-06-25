import { useAuthStore } from '../store/authStore';

// Token management utilities
export const formatTokenExpiry = (expiresAt: number | null): string => {
  if (!expiresAt) return 'No expiry time';
  
  const now = Date.now();
  const timeLeft = expiresAt - now;
  
  if (timeLeft <= 0) {
    return 'EXPIRED';
  }
  
  const minutes = Math.floor(timeLeft / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
};

export const getTokenStatus = (expiresAt: number | null, bufferMinutes: number = 5) => {
  if (!expiresAt) return 'INVALID';
  
  const now = Date.now();
  const timeLeft = expiresAt - now;
  const bufferMs = bufferMinutes * 60 * 1000;
  
  if (timeLeft <= 0) {
    return 'EXPIRED';
  } else if (timeLeft <= bufferMs) {
    return 'EXPIRING_SOON';
  } else {
    return 'VALID';
  }
};

export const logTokenStatus = () => {
  const authData = useAuthStore.getState();
  if (!authData) return;

  const { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt } = authData;
  
  // Remove debug logging to avoid cluttering terminal
}; 
