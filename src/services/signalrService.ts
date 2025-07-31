// NOTE: To use SignalR, install the package first:
// npm install @microsoft/signalr

import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { Notification } from '../types';
import { API_CONFIG } from '../utils/config';
import { useEventStore } from '../store/eventStore';
import { useNewsStore } from '../store/newsStore';
import { useCheckInStore } from '../store/checkInStore';
import { useNavigationState } from '@react-navigation/native';
import { ToastAndroid } from 'react-native';
import i18n from '../utils/i18n';

// Types for SignalR (to avoid import errors when package is not installed)
interface HubConnection {
  state: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  on(methodName: string, callback: (...args: any[]) => void): void;
  invoke(methodName: string, ...args: any[]): Promise<any>;
  onclose(callback: (error?: Error) => void): void;
  onreconnecting(callback: (error?: Error) => void): void;
  onreconnected(callback: (connectionId?: string) => void): void;
}

interface HubConnectionBuilder {
  withUrl(url: string, options?: any): HubConnectionBuilder;
  withAutomaticReconnect(options?: any): HubConnectionBuilder;
  configureLogging(level: any): HubConnectionBuilder;
  build(): HubConnection;
}

class SignalRService {
  private connection: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private isDisabled = false;

  constructor() {
    this.isDisabled = false;
    this.initializeConnection();
  }

  private initializeConnection() {
    if (this.connection) {
      return;
    }

    try {
      const { HubConnectionBuilder, LogLevel, HttpTransportType } = require('@microsoft/signalr');
      if (typeof global.URL === 'undefined') {
        global.URL = require('react-native-url-polyfill/auto');
      }
      // Sử dụng endpoint hub đúng chuẩn backend cung cấp
      this.connection = new HubConnectionBuilder()
        .withUrl(`${API_CONFIG.NOTIFICATION_SERVICE_URL}/hubs/notifications`, {
          transport: HttpTransportType.WebSockets,
          accessTokenFactory: () => {
            const authStore = useAuthStore.getState();
            return authStore.accessToken || '';
          },
          skipNegotiation: true,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext: any) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
            return null;
          },
        })
        .configureLogging(LogLevel.Warning)
        .build();
      this.setupEventHandlers();
    } catch (error) {
      console.warn('SignalR initialization failed:', error);
      this.connection = null;
      return;
    }
  }

  private setupEventHandlers() {
    if (!this.connection) return;
    
    // Notification
    this.connection.on('ReceiveNotification', (notification: Notification) => {
      if (notification && notification.notificationId) {
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification(notification);
        
        // Hiển thị toast nếu user không ở NotificationsScreen, đa ngôn ngữ
        const message = notification.notificationTitle || i18n.t('notifications.newMessage') || 'Có thông báo mới';
        try {
          const navState = global.navigationRef?.getCurrentRoute?.();
          if (!navState || navState.name !== 'Notifications') {
            ToastAndroid.show(
              message,
              ToastAndroid.LONG
            );
          }
        } catch (e) {
          ToastAndroid.show(
            message,
            ToastAndroid.LONG
          );
        }
        this.showNotificationToUser(notification);
      }
    });

    // Dashboard/collaborator
    this.connection.on('OnCollaboratorStaticChanged', (stats: any) => {
      const eventStore = useEventStore.getState();
      if (eventStore.setCollaboratorStats) {
        eventStore.setCollaboratorStats(stats);
      }
    });

    // Check-in history
    this.connection.on('OnCheckinLogHistoryChanged', (checkinLogs: any) => {
      const checkInStore = useCheckInStore.getState();
      if (checkInStore.setCheckInHistoryRealtime) {
        checkInStore.setCheckInHistoryRealtime(checkinLogs);
      }
    });

    // News
    this.connection.on('OnNewsCreated', (news: any) => {
      const newsStore = useNewsStore.getState();
      if (newsStore.setNewsRealtime) {
        newsStore.setNewsRealtime(news);
      }
    });

    this.connection.on('OnNewsUpdated', (news: any) => {
      const newsStore = useNewsStore.getState();
      if (newsStore.setNewsRealtime) {
        newsStore.setNewsRealtime(news);
      }
    });

    // Analytics/events
    this.connection.on('OnEventManagerDashboard', (dashboard: any) => {
      // TODO: update event stats/dashboard
    });

    // Client methods that backend might try to invoke
    this.connection.on('notificationread', (notificationId: string) => {
      // Handle notification read confirmation from server
    });

    this.connection.on('allnotificationsread', (userId: string) => {
      // Handle all notifications read confirmation from server
    });

    // Connection events
    this.connection.onclose((error: any) => {
      //console.log('SignalR connection closed:', error);
      this.reconnectAttempts = 0;
    });

    this.connection.onreconnecting((error: any) => {
      //console.log('SignalR reconnecting:', error);
    });

    this.connection.onreconnected((connectionId: any) => {
      //console.log('SignalR reconnected:', connectionId);
      this.reconnectAttempts = 0;
      this.joinUserGroup();
    });
  }

  async connect(): Promise<void> {
    if (this.isDisabled || !this.connection || this.isConnecting) {
      return;
    }
    if (this.connection.state === 'Connected') {
      return;
    }
    try {
      this.isConnecting = true;
      await this.connection.start();
      await this.joinUserGroup();
      this.reconnectAttempts = 0;
    } catch (error) {
      if (error && error.toString().includes('pathname')) {
        this.isDisabled = true;
        return;
      }
      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        const delay = Math.min(
          this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
          30000
        );
        setTimeout(() => {
          this.connect();
        }, delay);
      } else {
        this.isDisabled = true;
      }
    } finally {
      this.isConnecting = false;
    }
  }

  async joinUserGroup(): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      return;
    }
    try {
      const authStore = useAuthStore.getState();
      const user = authStore.user;
      if (user?.userId) {
        await this.connection.invoke('JoinUserGroup', user.userId);
      } else if (user?.accountId) {
        // Fallback to old method if userId not available
        await this.connection.invoke('JoinGroup', `User_${user.accountId}`);
      }
    } catch (error) {
      console.error('Failed to join user group:', error);
    }
  }

  async joinEventGroup(eventId: string): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      return;
    }
    try {
      await this.connection.invoke('JoinEventGroup', eventId);
    } catch (error) {
      console.error('Failed to join event group:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }
    try {
      await this.connection.stop();
    } catch (error) {
      console.error('Error disconnecting SignalR:', error);
    }
  }

  showNotificationToUser(notification: Notification) {
    // Handle notification display logic if needed
  }

  getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  isConnected(): boolean {
    return !this.isDisabled && this.connection?.state === 'Connected';
  }

  isAvailable(): boolean {
    return !this.isDisabled && this.connection !== null;
  }

  async reconnect(): Promise<void> {
    if (this.isDisabled) {
      return;
    }
    await this.disconnect();
    this.reconnectAttempts = 0;
    await this.connect();
  }
}

export const signalrService = new SignalRService(); 