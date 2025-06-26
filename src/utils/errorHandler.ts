import { ErrorCode, AppError } from '../types';

export const handleApiError = (error: any, t?: Function): string => {
  // Fallback function if no translation function provided
  const translate = t || ((key: string, options?: any) => {
    // Extract the last part after the dot for fallback
    const fallbackKey = key.split('.').pop() || key;
    return options?.defaultValue || fallbackKey.replace(/_/g, ' ').toLowerCase();
  });

  // FIRST: Check if error has a message (includes our custom errors like WRONG_ROLE)
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
      'SERVER_ERROR',
      'ACCOUNT_NOT_ACTIVE',
      'EMAIL_NOT_VERIFIED',
      'USER_PROFILE_NOT_FOUND',
      'WRONG_ROLE',
      'LOGIN_ERROR',
      'ACCOUNT_NOT_FOUND',
      'INVALID_OR_EXPIRED_CODE',
      'PASSWORD_RESET_ERROR'
    ];
    
    if (errorKeys.includes(possibleErrorCode)) {
      return translate(`errors.${possibleErrorCode}`);
    }
  }

  // SECOND: Check if it's a backend API response error (our API structure)
  if (error.response?.data?.message) {
    // Backend returns: {flag: false, code: 401, message: "Invalid username or password"}
    const backendMessage = error.response.data.message;
    
    // Map specific backend messages for forgot/reset password
    if (backendMessage === 'Account not found') {
      return translate('errors.ACCOUNT_NOT_FOUND');
    }
    
    if (backendMessage === 'Invalid or expired verification code') {
      return translate('errors.INVALID_OR_EXPIRED_CODE');
    }
    
    if (backendMessage === 'An error occurred while processing password reset request. Please try again.' ||
        backendMessage === 'An error occurred while resetting password. Please try again.') {
      return translate('errors.PASSWORD_RESET_ERROR');
    }
    
    // Try to translate the backend message if we have a translation for it
    const translatedMessage = translate(`errors.${backendMessage}`, { defaultValue: null });
    if (translatedMessage && translatedMessage !== `errors.${backendMessage}`) {
      return translatedMessage;
    }
    
    // Return the backend message as-is if no translation found
    return backendMessage;
  }
  
  // THIRD: Check if it's an API response error with error code (alternative structure)
  if (error.response?.data?.error) {
    const errorCode = error.response.data.error as ErrorCode;
    return translate(`errors.${errorCode}`, { defaultValue: translate('errors.UNKNOWN_ERROR') });
  }
  
  // FOURTH: Check for specific HTTP status codes
  if (error.response?.status === 401) {
    return translate('errors.UNAUTHORIZED');
  }
  
  if (error.response?.status === 403) {
    return translate('errors.UNAUTHORIZED');
  }
  
  if (error.response?.status === 404) {
    return translate('errors.TICKET_NOT_FOUND');
  }
  
  if (error.response?.status >= 500) {
    return translate('errors.SERVER_ERROR');
  }
  
  // FIFTH: Network errors (only after checking message)
  if (error.code === 'NETWORK_ERROR' || (error.code === 'ECONNABORTED') || (error.code === 'ENOTFOUND') || (error.code === 'ECONNREFUSED')) {
    return translate('errors.NETWORK_ERROR');
  }
  
  // SIXTH: Check for no response (but only if not already handled above)
  if (!error.response && !error.message) {
    return translate('errors.NETWORK_ERROR');
  }
  
  // LAST: Return raw message or fallback
  if (error.message) {
    return error.message;
  }
  
  // Fallback to unknown error
  return translate('errors.UNKNOWN_ERROR');
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
