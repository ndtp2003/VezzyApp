// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://192.168.38.182:5000', // Backend server IP
  TIMEOUT: 30000, // Increased to 30 seconds for better reliability
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Authentication Configuration
export const AUTH_CONFIG = {
  TOKEN_EXPIRE_TIME: 10800, // 3 hours in seconds
  REFRESH_TOKEN_EXPIRE_TIME: 7 * 24 * 60 * 60, // 7 days in seconds
  ALLOWED_ROLES: ['Collaborator'],
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Vezzy',
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_THEME: 'system' as const,
  LOGO_URL: 'https://oqijlbtsoeobnditrqxf.supabase.co/storage/v1/object/public/avatars//125fb4b5-f608-45b4-a946-226efb368598_638845435117825139.jpg',
};

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
};

// QR Code Configuration
export const QR_CONFIG = {
  SCAN_DELAY: 2000, // ms
  CAMERA_QUALITY: 0.8,
  FLASH_MODE: 'off' as const,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  SETTINGS: 'settings-storage',
  THEME: 'theme-preference',
  LANGUAGE: 'language-preference',
};

// Error Codes
export const ERROR_CODES = {
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  TICKET_ALREADY_USED: 'TICKET_ALREADY_USED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  LOG_CREATION_FAILED: 'LOG_CREATION_FAILED',
  CHECKIN_ERROR: 'CHECKIN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/account/login',
  LOGOUT: '/api/account/logout',
  REFRESH_TOKEN: '/api/account/refresh-token',
  UPDATE_PROFILE: '/api/account/profile',
  CHANGE_PASSWORD: '/api/account/change-password',
  
  // Events
  MY_EVENTS: '/api/event/collaborator/my-events',
  EVENT_DETAIL: (eventId: string) => `/api/event/${eventId}`,
  EVENT_STATS: (eventId: string) => `/api/event/${eventId}/stats`,
  
  // Check-in
  CHECKIN_MOBILE: '/api/ticketissued/checkinMobile',
  CHECKIN_HISTORY: (eventId: string) => `/api/ticketissued/event/${eventId}/checkin-history`,
  
  // News
  NEWS_ACTIVE: '/api/news/active',
  NEWS_DETAIL: (newsId: string) => `/api/news/${newsId}`,
  
  // Notifications
  USER_NOTIFICATIONS: (userId: string) => `/api/notification/user/${userId}`,
  MARK_NOTIFICATION_READ: (notificationId: string) => `/api/notification/${notificationId}/read`,
  MARK_ALL_NOTIFICATIONS_READ: '/api/notification/mark-all-read',
  
  // Settings
  USER_CONFIG: (userId: string) => `/api/user/${userId}/config`,
  
  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
} as const;

// Development Configuration
export const DEV_CONFIG = {
  ENABLE_LOGS: __DEV__,
  ENABLE_DEBUG: __DEV__,
  MOCK_APIS: false,
  BYPASS_AUTH: false,
};

export type ErrorCode = keyof typeof ERROR_CODES; 
