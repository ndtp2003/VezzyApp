export * from './errorHandler';
export * from './toast';
export { default as i18n } from './i18n';

// Date utilities
export const formatDate = (dateString: string, locale: string = 'en'): string => {
  const date = new Date(dateString);
  
  if (locale === 'vi') {
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string, locale: string = 'en'): string => {
  const date = new Date(dateString);
  
  if (locale === 'vi') {
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRelativeTime = (dateString: string, locale: string = 'en'): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = [
    { label: locale === 'vi' ? 'năm' : 'year', seconds: 31536000 },
    { label: locale === 'vi' ? 'tháng' : 'month', seconds: 2592000 },
    { label: locale === 'vi' ? 'tuần' : 'week', seconds: 604800 },
    { label: locale === 'vi' ? 'ngày' : 'day', seconds: 86400 },
    { label: locale === 'vi' ? 'giờ' : 'hour', seconds: 3600 },
    { label: locale === 'vi' ? 'phút' : 'minute', seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      if (locale === 'vi') {
        return `${count} ${interval.label} trước`;
      }
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  
  return locale === 'vi' ? 'Vừa xong' : 'Just now';
};

// String utilities
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

// Device utilities
export const isTablet = (width: number, height: number): boolean => {
  const minTabletWidth = 768;
  return Math.min(width, height) >= minTabletWidth;
};

// Array utilities
export const groupBy = <T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

// Async utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await delay(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}; 
