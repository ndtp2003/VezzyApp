// API Response Types
export interface ApiResponse<T = any> {
  flag: boolean;
  code: number;
  message: string;
  data: T;
}

// Pagination structure từ backend mới
export interface PaginatedData<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Enums from Backend
export enum Role {
  Admin = 0,
  Customer = 1,
  EventManager = 2,
  Collaborator = 3,
  Other = 4,
}

export enum Gender {
  Male = 0,
  Female = 1,
  Other = 2,
  Unknown = 3,
}

export enum NewsStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export enum NotificationType {
  EventApproved = 0,
  PayoutProcessed = 1,
  OrderSuccess = 2,
  EventManagerNewEvent = 3,
  EventManagerUpdateEvent = 4,
  EventManagerNewPost = 5,
  AdminNewEvent = 6,
  EventApprovedByAdmin = 7,
  EventRejectedByAdmin = 8,
  AdminNewReport = 9,
  WithdrawalRequested = 10,
  WithdrawalApproved = 11,
  WithdrawalRejected = 12,
  AdminWithdrawalRequest = 13,
  Other = 14,
}

// Backend Classes Mapping
export interface Account {
  accountId: string; // Guid in backend
  username: string;
  email: string;
  role: Role; // Enum
  isActive: boolean;
  isEmailVerified: boolean;
  isOnline: boolean;
  lastActiveAt: string; // DateTime
  lastLoginDevice: string;
  lastLoginIP?: string;
  lastLoginLocation?: string;
  createdAt: string; // DateTime
  lastLogin: string; // DateTime
}

export interface User {
  userId: string; // Guid in backend
  accountId: string; // Reference to Account
  fullName: string;
  phone?: string;
  email: string;
  avatarUrl?: string;
  gender: Gender; // Enum
  dob?: string; // DateTime nullable
  location?: string;
  createdAt: string; // DateTime
}

// Combined interface for frontend convenience
export interface CombinedUserData {
  // Account fields
  accountId: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  isOnline: boolean;
  lastActiveAt: string;
  lastLoginDevice: string;
  lastLoginIP?: string;
  lastLoginLocation?: string;
  accountCreatedAt: string;
  lastLogin: string;
  
  // User fields
  userId: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  gender: Gender;
  dob?: string;
  location?: string;
  userCreatedAt?: string;
}

export interface UserConfig {
  userConfigId: string;
  userId: string;
  language: 'en' | 'vi'; // Language enum
  theme: 'light' | 'dark' | 'system'; // Theme enum  
  receiveEmail: boolean;
  receiveNotify: boolean;
  customOptions?: any; // BsonDocument
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Backend response format (actual structure from API)
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  account: {
    // Account fields
    accountId: string;
    username: string;
    email: string;
    role: number; // Backend enum value
    isActive: boolean;
    isEmailVerified: boolean;
    isOnline: boolean;
    lastActiveAt: string;
    lastLoginDevice: string;
    lastLoginIP?: string;
    lastLoginLocation?: string;
    createdAt: string;
    lastLogin: string;
    
    // User fields (merged in response)
    userId: string;
    phone?: string;
    gender: number; // Backend enum value
    dob?: string;
    location?: string;
    avatar?: string; // avatarUrl in backend
    
    // User config (nested in account)
    userConfig: {
      language: number; // Backend enum
      theme: number; // Backend enum
      receiveEmail: boolean;
      receiveNotify: boolean;
    };
  };
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

export interface UpdateUserConfigRequest {
  language: number;
  theme: number;
  receiveEmail: boolean;
  receiveNotify: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  verificationCode: string;
  newPassword: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}

// Event Types - Cập nhật theo API mới
export interface Event {
  eventId: string; // Guid
  eventName: string;
  eventDescription: string;
  startAt: string; // DateTime
  endAt: string; // DateTime
  isApproved: string; // "Approved", "Pending", etc.
  isCancelled: boolean;
  createdBy: string;
  categoryId: string; // Guid
}

export interface EventStats {
  totalCheckIns: number;
  todayCheckIns: number;
  lastCheckIn?: string;
}

// Ticket & Check-in Types - Cập nhật theo API mới
export interface TicketIssued {
  issuedId: string; // Guid
  ticketId: string;
  eventId: string;
  qrCode: string;
  used: boolean;
  checkedInAt?: string; // nullable DateTime
  checkedInBy?: string; // nullable accountId
  issuedToEmail: string;
  createdAt: string; // DateTime
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

// News Types - Cập nhật theo API mới
export interface News {
  newsId: string; // Guid
  eventId?: string; // nullable
  newsDescription: string;
  newsTitle: string;
  newsContent: string;
  authorId: string;
  authorName?: string; // Author name from API
  imageUrl?: string; // nullable
  status: NewsStatus; // Enum: Pending, Approved, Rejected
  createdAt: string; // DateTime
  updatedAt: string; // DateTime
}

// Notification Types - Cập nhật theo API mới
export interface Notification {
  notificationId: string; // Guid
  userId: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: NotificationType; // Enum
  isRead: boolean;
  redirectUrl?: string; // nullable
  createdAt: string; // DateTime
  createdAtVietnam: string; // DateTime in Vietnam timezone
  readAt?: string; // nullable DateTime
  readAtVietnam?: string; // nullable DateTime in Vietnam timezone
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
  ForgotPassword: undefined;
  ResetPassword: { email: string };
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
  EditProfile: undefined;
  ChangePassword: undefined;
  Settings: undefined;
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
  | 'UNKNOWN_ERROR'
  | 'ACCOUNT_NOT_FOUND'
  | 'INVALID_OR_EXPIRED_CODE'
  | 'PASSWORD_RESET_ERROR';

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
  status?: Event['isApproved'];
  dateFrom?: string;
  dateTo?: string;
  location?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
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
