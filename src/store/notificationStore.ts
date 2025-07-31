import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { Notification, PaginatedData, ApiResponse } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  hasMorePages: boolean;
  currentPage: number;
  pageSize: number;
  error: string | null;
}

interface NotificationActions {
  // Fetch notifications with pagination
  fetchNotifications: (page?: number, refresh?: boolean) => Promise<void>;
  
  // Mark single notification as read
  markAsRead: (notificationId: string) => Promise<void>;
  
  // Mark all notifications as read
  markAllAsRead: () => Promise<void>;
  
  // Add new notification (for realtime)
  addNotification: (notification: Notification) => void;
  
  // Clear all notifications
  clearNotifications: () => void;
  
  // Reset state
  reset: () => void;
  
  // Update unread count
  updateUnreadCount: () => void;
  
  // Set loading states
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Load mock data for testing (remove when backend is ready)
  loadMockNotifications: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

// Helper function để auto-fetch notifications khi user đã authenticated
export const initializeNotifications = async () => {
  try {
    const authStore = require('./authStore').useAuthStore.getState();
    const notificationStore = require('./notificationStore').useNotificationStore.getState();
    
    if (authStore.isAuthenticated && authStore.user?.userId) {
      // Fetch notifications silently in background
      await notificationStore.fetchNotifications(1, false);
    }
  } catch (error) {
    // Silent failure - không hiển thị error cho user
  }
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isRefreshing: false,
  hasMorePages: true,
  currentPage: 1,
  pageSize: 20,
  error: null,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchNotifications: async (page = 1, refresh = false) => {
        try {
          if (refresh || page === 1) {
            set({ isRefreshing: refresh, isLoading: !refresh, error: null });
          } else {
            set({ isLoading: true, error: null });
          }

          const authStore = require('./authStore').useAuthStore.getState();
          const user = authStore.user;
          
          if (!user?.userId) {
            console.warn('User not authenticated for notifications');
            throw new Error('User not authenticated');
          }

          const response = await apiService.getUserNotifications(
            user.userId,
            {
              page,
              pageSize: get().pageSize,
            }
          );

          if (response.flag && response.data) {
            const { items, hasNextPage, currentPage } = response.data;
            
            // Validate notification items
            const validNotifications = items.filter((item: any) => {
              if (!item || typeof item !== 'object') {
                console.warn('Invalid notification item:', item);
                return false;
              }
              if (!item.notificationId) {
                console.warn('Notification missing ID:', item);
                return false;
              }
              return true;
            });

            set(state => ({
              notifications: page === 1 ? validNotifications : [...state.notifications, ...validNotifications],
              currentPage: currentPage,
              hasMorePages: hasNextPage,
              isLoading: false,
              isRefreshing: false,
              error: null,
            }));

            // Update unread count
            get().updateUnreadCount();
          } else {
            throw new Error(response.message || 'Failed to fetch notifications');
          }
        } catch (error) {
          console.error('API fetch failed, error:', error);
          
          // Fallback to mock data if API fails (for development)
          if (page === 1 && get().notifications.length === 0) {
            get().loadMockNotifications();
          } else {
            set({
              isLoading: false,
              isRefreshing: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
            });
          }
        }
      },

      markAsRead: async (notificationId: string) => {
        try {
          const authStore = require('./authStore').useAuthStore.getState();
          const user = authStore.user;
          
          if (!user?.userId) {
            console.warn('User not authenticated for mark as read');
            throw new Error('User not authenticated');
          }

          const response = await apiService.markNotificationAsRead(notificationId, user.userId);
          
          if (response.flag) {
            // Update local state
            set(state => ({
              notifications: state.notifications.map(notification =>
                notification.notificationId === notificationId
                  ? {
                      ...notification,
                      isRead: true,
                      readAt: new Date().toISOString(),
                      readAtVietnam: new Date().toISOString(), // Simplified for now
                    }
                  : notification
              ),
            }));

            // Update unread count
            get().updateUnreadCount();
          } else {
            throw new Error(response.message || 'Failed to mark notification as read');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to mark as read',
          });
        }
      },

      markAllAsRead: async () => {
        try {
          const authStore = require('./authStore').useAuthStore.getState();
          const user = authStore.user;
          
          if (!user?.userId) {
            console.warn('User not authenticated for mark all as read');
            throw new Error('User not authenticated');
          }

          const response = await apiService.markAllNotificationsAsRead(user.userId);
          
          if (response.flag) {
            // Update all notifications to read
            const now = new Date().toISOString();
            set(state => ({
              notifications: state.notifications.map(notification => ({
                ...notification,
                isRead: true,
                readAt: now,
                readAtVietnam: now,
              })),
            }));

            // Update unread count
            get().updateUnreadCount();
          } else {
            throw new Error(response.message || 'Failed to mark all as read');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to mark all as read',
          });
        }
      },

      addNotification: (notification: Notification) => {
        // Validate notification before adding
        if (!notification || !notification.notificationId) {
          console.warn('Invalid notification data, skipping:', notification);
          return;
        }
        
        set(state => {
          // Check if notification already exists to avoid duplicates
          const existingIndex = state.notifications.findIndex(n => n.notificationId === notification.notificationId);
          
          if (existingIndex >= 0) {
            // Update existing notification if it's different
            const updatedNotifications = [...state.notifications];
            updatedNotifications[existingIndex] = notification;
            return { notifications: updatedNotifications };
          } else {
            // Add new notification at the beginning
            return { notifications: [notification, ...state.notifications] };
          }
        });
        
        // Update unread count
        get().updateUnreadCount();
      },
      // TODO: add more realtime handlers for dashboard, check-in, news, ...

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
          currentPage: 1,
          hasMorePages: true,
          error: null,
        });
      },

      reset: () => {
        set(initialState);
      },

      updateUnreadCount: () => {
        const { notifications } = get();
        try {
          const unreadCount = notifications.filter(n => n && typeof n === 'object' && !n.isRead).length;
          set({ unreadCount });
        } catch (error) {
          console.warn('Error updating unread count:', error);
          set({ unreadCount: 0 });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setRefreshing: (refreshing: boolean) => {
        set({ isRefreshing: refreshing });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // Temporary mock data for testing UI (remove when backend is ready)
      loadMockNotifications: () => {
        const mockNotifications: Notification[] = [
          {
            notificationId: 'mock-1',
            userId: 'user-1',
            notificationTitle: 'Sự kiện mới được tạo',
            notificationMessage: 'Bạn đã được phân công tham gia sự kiện "Tech Conference 2024". Vui lòng kiểm tra chi tiết.',
            notificationType: 'EventAssigned' as any,
            isRead: false,
            redirectUrl: '/events/1',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
            createdAtVietnam: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            readAt: null,
            readAtVietnam: null,
          },
          {
            notificationId: 'mock-2',
            userId: 'user-1',
            notificationTitle: 'Tin tức mới',
            notificationMessage: 'Có tin tức quan trọng vừa được đăng tải. Hãy xem ngay!',
            notificationType: 'NewsPublished' as any,
            isRead: true,
            redirectUrl: '/news/1',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            createdAtVietnam: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            readAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            readAtVietnam: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
          {
            notificationId: 'mock-3',
            userId: 'user-1',
            notificationTitle: 'Sự kiện được phê duyệt',
            notificationMessage: 'Sự kiện "Workshop Design Thinking" của bạn đã được phê duyệt và sẽ diễn ra vào ngày mai.',
            notificationType: 'EventApproved' as any,
            isRead: false,
            redirectUrl: '/events/2',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            createdAtVietnam: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            readAt: null,
            readAtVietnam: null,
          },
          {
            notificationId: 'mock-4',
            userId: 'user-1',
            notificationTitle: 'Cập nhật hệ thống',
            notificationMessage: 'Hệ thống sẽ được bảo trì vào 2:00 AM đêm nay. Vui lòng lưu ý.',
            notificationType: 'SystemUpdate' as any,
            isRead: true,
            redirectUrl: null,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            createdAtVietnam: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            readAtVietnam: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            notificationId: 'mock-5',
            userId: 'user-1',
            notificationTitle: 'Chúc mừng!',
            notificationMessage: 'Bạn đã hoàn thành xuất sắc nhiệm vụ check-in cho sự kiện "Annual Meeting 2024".',
            notificationType: 'CheckInCompleted' as any,
            isRead: false,
            redirectUrl: '/events/3',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
            createdAtVietnam: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            readAt: null,
            readAtVietnam: null,
          },
        ];

        set({
          notifications: mockNotifications,
          isLoading: false,
          isRefreshing: false,
          error: null,
          hasMorePages: false,
          currentPage: 1,
        });

        // Update unread count
        get().updateUnreadCount();
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
); 