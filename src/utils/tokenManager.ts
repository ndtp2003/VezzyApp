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

export const logTokenDebugInfo = (
  accessToken: string | null,
  refreshToken: string | null,
  accessTokenExpiresAt: number | null,
  refreshTokenExpiresAt: number | null
) => {
  if (__DEV__) {
    console.log('=== TOKEN DEBUG INFO ===');
    console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');
    console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null');
    console.log('Access Token Status:', getTokenStatus(accessTokenExpiresAt));
    console.log('Access Token Expires:', formatTokenExpiry(accessTokenExpiresAt));
    console.log('Refresh Token Status:', getTokenStatus(refreshTokenExpiresAt));
    console.log('Refresh Token Expires:', formatTokenExpiry(refreshTokenExpiresAt));
    console.log('========================');
  }
}; 