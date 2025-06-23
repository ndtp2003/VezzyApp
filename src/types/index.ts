// API Response Types
export interface ApiResponse<T = any> {
  flag: boolean;
  code: number;
  message: string;
  data: T;
}

// User & Authentication Types
export interface User {
  accountId: string; // ⚠️ LƯU Ý: Đây là userId trong JWT token claims
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  gender: string;
  dob?: string; // Date of birth
  location?: string; // User location (null when register, can be updated)
  avatar?: string; // Avatar URL
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // 10800 (3 hours)
  user: User;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // timestamp
  refreshTokenExpiresAt: number; // timestamp
  issuedAt: number; // timestamp
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  phone?: string;
  dob?: string; // Date of birth
  gender: string;
  location?: string; // User location (only when updating, not in register)
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Event Types
export interface Event {
  eventId: string;
  eventName: string;
  eventDescription: string;
  eventStartDate: string;
  eventEndDate: string;
  eventLocation: string;
  capacity: number;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Active' | 'Completed' | 'Cancelled';
  bannerImage?: string;
  createdBy: string;
  createdAt: string;
}

export interface EventStats {
  totalCheckIns: number;
  todayCheckIns: number;
  lastCheckIn?: string;
}

// Ticket & Check-in Types
export interface TicketIssued {
  id: string;
  ticketCode: string;
  eventId: string;
  userId: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  issuedAt: string;
  usedAt?: string;
  qrContent: string;
}

export interface CheckInRequest {
  qrContent: string;
}

export interface CheckInResponse {
  success: boolean;
  ticketInfo?: TicketIssued;
  message: string;
}

export interface TicketIssuedResponse {
  ticketIssuedId: string;
  qrCode: string;
  eventId: string;
  userEmail: string;
  used: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  issuedAt: string;
}

// News Types
export interface News {
  newsId: string;
  title: string;
  description: string;
  content: string;
  bannerImage?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  notificationId: string;
  userId: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: string;
  isRead: boolean;
  redirectUrl?: string;
  createdAt: string;
  readAt?: string;
}

// Settings Types
export interface UserSettings {
  language: 'en' | 'vi';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showOnlineStatus: boolean;
  };
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  QRScanner: { eventId: string };
  EventDetail: { eventId: string };
  NewsDetail: { newsId: string };
  ChangePassword: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  News: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type EventStackParamList = {
  EventsList: undefined;
  EventDetail: { eventId: string };
  QRScanner: { eventId: string };
};

export type NewsStackParamList = {
  NewsList: undefined;
  NewsDetail: { newsId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  ChangePassword: undefined;
};

// Error Types
export type ErrorCode = 
  | 'TICKET_NOT_FOUND'
  | 'TICKET_ALREADY_USED'
  | 'UPDATE_FAILED'
  | 'LOG_CREATION_FAILED'
  | 'CHECKIN_ERROR'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
}

// Component Props Types
export interface LoadingProps {
  visible: boolean;
  message?: string;
}

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
}

export interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

// Form Types
export interface FormField {
  label: string;
  placeholder?: string;
  value: string;
  error?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

// Stats Types
export interface DashboardStats {
  totalEvents: number;
  totalCheckIns: number;
  todayCheckIns: number;
  thisWeekCheckIns: number;
  thisMonthCheckIns: number;
}

// Search & Filter Types
export interface SearchFilters {
  query?: string;
  status?: Event['status'];
  dateFrom?: string;
  dateTo?: string;
  location?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 