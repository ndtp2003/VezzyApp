import { ErrorCode, AppError } from '../types';

export const handleApiError = (error: any, t: Function): string => {
  // Check if it's a backend API response error (our API structure)
  if (error.response?.data?.message) {
    // Backend returns: {flag: false, code: 401, message: "Invalid username or password"}
    const backendMessage = error.response.data.message;
    
    // Try to translate the backend message if we have a translation for it
    const translatedMessage = t(`errors.${backendMessage}`, { defaultValue: null });
    if (translatedMessage && translatedMessage !== `errors.${backendMessage}`) {
      return translatedMessage;
    }
    
    // Return the backend message as-is if no translation found
    return backendMessage;
  }
  
  // Check if it's an API response error with error code (alternative structure)
  if (error.response?.data?.error) {
    const errorCode = error.response.data.error as ErrorCode;
    return t(`errors.${errorCode}`, { defaultValue: t('errors.UNKNOWN_ERROR') });
  }
  
  // Check for specific HTTP status codes
  if (error.response?.status === 401) {
    return t('errors.UNAUTHORIZED');
  }
  
  if (error.response?.status === 403) {
    return t('errors.UNAUTHORIZED');
  }
  
  if (error.response?.status === 404) {
    return t('errors.TICKET_NOT_FOUND');
  }
  
  if (error.response?.status >= 500) {
    return t('errors.SERVER_ERROR');
  }
  
  // Network errors
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    return t('errors.NETWORK_ERROR');
  }
  
  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    return t('errors.NETWORK_ERROR');
  }
  
  // Check if error has a message
  if (error.message) {
    // Check if the message is an error code
    const possibleErrorCode = error.message as ErrorCode;
    const errorKeys = [
      'TICKET_NOT_FOUND',
      'TICKET_ALREADY_USED',
      'UPDATE_FAILED',
      'LOG_CREATION_FAILED',
      'CHECKIN_ERROR',
      'NETWORK_ERROR',
      'UNAUTHORIZED',
      'INVALID_CREDENTIALS',
      'SERVER_ERROR'
    ];
    
    if (errorKeys.includes(possibleErrorCode)) {
      return t(`errors.${possibleErrorCode}`);
    }
    
    return error.message;
  }
  
  // Fallback to unknown error
  return t('errors.UNKNOWN_ERROR');
};

export const createAppError = (code: ErrorCode, message?: string, details?: any): AppError => {
  return {
    code,
    message: message || code,
    details,
  };
};

export const isNetworkError = (error: any): boolean => {
  return (
    error.code === 'NETWORK_ERROR' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED' ||
    !error.response
  );
};

export const isAuthError = (error: any): boolean => {
  return (
    error.response?.status === 401 ||
    error.response?.status === 403 ||
    error.response?.data?.message === 'UNAUTHORIZED'
  );
};

export const getErrorCode = (error: any): ErrorCode => {
  if (error.response?.data?.message) {
    return error.response.data.message as ErrorCode;
  }
  
  if (error.response?.status === 401 || error.response?.status === 403) {
    return 'UNAUTHORIZED';
  }
  
  if (error.response?.status === 404) {
    return 'TICKET_NOT_FOUND';
  }
  
  if (error.response?.status >= 500) {
    return 'SERVER_ERROR';
  }
  
  if (isNetworkError(error)) {
    return 'NETWORK_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
}; 