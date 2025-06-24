import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../utils/config';
import {
  ApiResponse,
  LoginRequest,
  AuthResponseDto,
  RefreshTokenRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateUserConfigRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AvatarUploadResponse,
  Event,
  CheckInRequest,
  TicketIssuedResponse,
  News,
  Notification,
  UserSettings,
  User,
  DashboardStats,
  PaginatedResponse,
  SearchFilters,
  PaginationParams
} from '../types';

class ApiService {
  private baseURL = API_CONFIG.BASE_URL;
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Debug logging
        if (__DEV__) {
          console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: `${config.baseURL}${config.url}`,
            data: config.data,
          });
        }
        // Skip token validation for public endpoints
        const skipTokenValidation = [
          '/api/account/login',
          '/api/account/refresh-token',
          '/api/account/forgot-password',
          '/api/account/reset-password'
        ].some(endpoint => config.url?.includes(endpoint));

        if (!skipTokenValidation && this.authToken) {
          // Check and refresh token if needed
          const { useAuthStore } = await import('../store/authStore');
          const isTokenValid = await useAuthStore.getState().ensureValidToken();
          
          if (!isTokenValid) {
            throw new Error('Authentication failed');
          }
          
          // Use the potentially refreshed token
          const currentToken = useAuthStore.getState().accessToken;
          if (currentToken) {
            config.headers.Authorization = `Bearer ${currentToken}`;
          }
        } else if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Debug logging for successful responses (only in development)
        if (__DEV__) {
          console.log('✅ API Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      (error) => {
        // Removed console error logging to avoid console popup
        // Error will be handled by error handler utility
        
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.setAuthToken(null);
          // You can emit an event here to trigger logout
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponseDto>> {
    const response = await this.axiosInstance.post('/api/account/login', credentials);
    return response.data;
  }

  async refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<ApiResponse<AuthResponseDto>> {
    const response = await this.axiosInstance.post('/api/account/refresh-token', refreshTokenRequest);
    return response.data;
  }

  async logout(): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.post('/api/account/logout');
    return response.data;
  }

  async updateProfile(userData: UpdateProfileRequest): Promise<ApiResponse<User>> {
    const response = await this.axiosInstance.put('/api/account/profile', userData);
    return response.data;
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.post('/api/account/change-password', data);
    return response.data;
  }

  async updateUserConfig(data: UpdateUserConfigRequest): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.put('/api/account/user-config', data);
    return response.data;
  }

  async uploadAvatar(formData: FormData): Promise<ApiResponse<AvatarUploadResponse>> {
    const response = await this.axiosInstance.post('/api/account/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.post('/api/account/forgot-password', data);
    return response.data;
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.post('/api/account/reset-password', data);
    return response.data;
  }

  // Events endpoints
  async getAssignedEvents(filters?: SearchFilters): Promise<ApiResponse<Event[]>> {
    const params = new URLSearchParams();
    if (filters?.query) params.append('search', filters.query);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.location) params.append('location', filters.location);

    const response = await this.axiosInstance.get(`/api/event/collaborator/my-events?${params}`);
    return response.data;
  }

  async getEventById(eventId: string): Promise<ApiResponse<Event>> {
    const response = await this.axiosInstance.get(`/api/event/${eventId}`);
    return response.data;
  }

  async getEventStats(eventId: string): Promise<ApiResponse<any>> {
    const response = await this.axiosInstance.get(`/api/event/${eventId}/stats`);
    return response.data;
  }

  // Check-in endpoints
  async checkInByQR(request: CheckInRequest): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.post('/api/ticketissued/checkinMobile', request);
    return response.data;
  }

  async getCheckinHistory(
    eventId: string, 
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<TicketIssuedResponse>>> {
    const params = new URLSearchParams();
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await this.axiosInstance.get(`/api/ticketissued/event/${eventId}/checkin-history?${params}`);
    return response.data;
  }

  // News endpoints
  async getActiveNews(pagination?: PaginationParams): Promise<ApiResponse<PaginatedResponse<News>>> {
    const params = new URLSearchParams();
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());

    const response = await this.axiosInstance.get(`/api/news/active?${params}`);
    return response.data;
  }

  async getNewsById(newsId: string): Promise<ApiResponse<News>> {
    const response = await this.axiosInstance.get(`/api/news/${newsId}`);
    return response.data;
  }

  // Notifications endpoints
  async getUserNotifications(
    userId: string,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const params = new URLSearchParams();
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('pageSize', pagination.limit.toString());

    const response = await this.axiosInstance.get(`/api/notification/user/${userId}?${params}`);
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.put(`/api/notification/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.put('/api/notification/mark-all-read');
    return response.data;
  }

  // Settings endpoints
  async getUserSettings(userId: string): Promise<ApiResponse<UserSettings>> {
    const response = await this.axiosInstance.get(`/api/user/${userId}/config`);
    return response.data;
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    const response = await this.axiosInstance.put(`/api/user/${userId}/config`, settings);
    return response.data;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await this.axiosInstance.get('/api/dashboard/stats');
    return response.data;
  }

  // Utility method to update base URL (for development)
  updateBaseURL(newBaseURL: string) {
    this.baseURL = newBaseURL;
    this.axiosInstance.defaults.baseURL = newBaseURL;
  }
}

export const apiService = new ApiService(); 