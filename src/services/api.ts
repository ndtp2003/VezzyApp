import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../utils/config';
import {
  ApiResponse,
  BackendApiResponse,
  PaginatedData,
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
  TicketIssued,
  News,
  Notification,
  UserSettings,
  User,
  DashboardStats,
  SearchFilters,
  PaginationParams,
  CheckInHistoryResponse,
  QRCodeDetailResponse
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
        // Skip token validation for public endpoints
        const skipTokenValidation = [
          '/api/account/login',
          '/api/account/refresh-token',
          '/api/account/forgot-password',
          '/api/account/reset-password',
          '/api/News/active', // News API is public
          '/api/News/all-Home' // News home API is also public
        ].some(endpoint => config.url?.includes(endpoint));

        if (!skipTokenValidation) {
          // Always get fresh token from authStore
          const { useAuthStore } = await import('../store/authStore');
          const isTokenValid = await useAuthStore.getState().ensureValidToken();
          
          if (!isTokenValid) {
            throw new Error('Authentication failed');
          }
          
          // Use the potentially refreshed token
          const currentToken = useAuthStore.getState().accessToken;
          if (currentToken) {
            // Set Authorization header directly
            (config.headers as any).Authorization = `Bearer ${currentToken}`;
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
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

  // Events endpoints - Cập nhật theo API mới
  async getAssignedEvents(): Promise<ApiResponse<Event[]>> {
    const response = await this.axiosInstance.get('/api/Event/collaborator/my-events');
    return response.data;
  }

  async getEventById(eventId: string): Promise<ApiResponse<Event>> {
    const response = await this.axiosInstance.get(`/api/Event/${eventId}`);
    return response.data;
  }

  async getEventStats(eventId: string): Promise<ApiResponse<any>> {
    const response = await this.axiosInstance.get(`/api/Event/${eventId}/stats`);
    return response.data;
  }

  // Check-in endpoints - Cập nhật theo API mới
  async checkInByQR(request: CheckInRequest): Promise<BackendApiResponse<boolean>> {
    const response = await this.axiosInstance.post('/api/TicketIssued/checkinMobile', request);
    return response.data;
  }

  // Get check-in history for an event (paginated)
  async getCheckInHistory(eventId: string, pageNumber: number = 1, pageSize: number = 10): Promise<CheckInHistoryResponse> {
    const response = await this.axiosInstance.get(`/api/TicketIssued/checkinloghistory/${eventId}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    
    // Handle backend response format mapping
    const backendResponse = response.data;
    
    // Map backend format {success, message, data} to expected format {isSuccess, message, data}
    if (backendResponse && typeof backendResponse.success === 'boolean') {
      return {
        isSuccess: backendResponse.success,
        message: backendResponse.message,
        data: backendResponse.data
      };
    }
    
    // If already in expected format, return as is
    return backendResponse;
  }

  // Get QR code ticket detail
  async getQRCodeDetail(qrCode: string): Promise<QRCodeDetailResponse> {
    const response = await this.axiosInstance.get(`/api/TicketIssued/qrdetail/${qrCode}`);
    
    // Handle backend response format mapping
    const backendResponse = response.data;
    
    // Map backend format {success, message, data} to expected format {isSuccess, message, data}
    if (backendResponse && typeof backendResponse.success === 'boolean') {
      return {
        isSuccess: backendResponse.success,
        message: backendResponse.message,
        data: backendResponse.data
      };
    }
    
    // If already in expected format, return as is
    return backendResponse;
  }

  async getCheckinHistory(
    eventId: string, 
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedData<TicketIssued>>> {
    const params = new URLSearchParams();
    if (pagination?.page) params.append('Page', pagination.page.toString());
    if (pagination?.pageSize) params.append('PageSize', pagination.pageSize.toString());

    const response = await this.axiosInstance.get(`/api/TicketIssued/event/${eventId}/checkin-history?${params}`);
    return response.data;
  }

  // News endpoints - Cập nhật theo API mới (PUBLIC)
  async getActiveNews(pagination?: PaginationParams): Promise<ApiResponse<PaginatedData<News>>> {
    const response = await this.axiosInstance.get('/api/News/all-Home');
    return response.data;
  }

  async getNewsById(newsId: string): Promise<ApiResponse<News>> {
    const response = await this.axiosInstance.get(`/api/News/${newsId}`);
    return response.data;
  }

  // Notifications endpoints - Cập nhật theo API mới
  async getUserNotifications(
    userId: string,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedData<Notification>>> {
    const params = new URLSearchParams();
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.pageSize) params.append('pageSize', pagination.pageSize.toString());

    const response = await this.axiosInstance.get(`/api/Notification/user/${userId}?${params}`);
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.put(`/api/Notification/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse<boolean>> {
    const response = await this.axiosInstance.put(`/api/Notification/user/${userId}/read-all`);
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
