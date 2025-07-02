// NOTE: To use SignalR, install the package first:
// npm install @microsoft/signalr

import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { Notification } from '../types';
import { API_CONFIG } from '../utils/config';

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
  private connection: HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private isDisabled = false; // Add flag to disable SignalR if needed

  constructor() {
    // Temporarily disable SignalR until backend is ready
    console.log('SignalR temporarily disabled - backend not ready');
    this.isDisabled = true;
    // this.initializeConnection(); // Comment out for now
  }

  private initializeConnection() {
    if (this.connection) {
      return;
    }

    try {
      // Dynamically import SignalR to avoid errors when package is not installed
      const { HubConnectionBuilder, LogLevel, HttpTransportType } = require('@microsoft/signalr');
      
      // Add URL polyfill for React Native
      if (typeof global.URL === 'undefined') {
        global.URL = require('react-native-url-polyfill/auto');
      }
      
      // Build SignalR connection with WebSocket transport only
      this.connection = new HubConnectionBuilder()
        .withUrl(`${API_CONFIG.NOTIFICATION_SERVICE_URL}/notificationHub`, {
          transport: HttpTransportType.WebSockets,
          accessTokenFactory: () => {
            const authStore = useAuthStore.getState();
            return authStore.accessToken || '';
          },
          skipNegotiation: true, // Skip negotiation when using WebSockets only
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext: any) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              // Exponential backoff: 1s, 2s, 4s, 8s, 16s
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
            return null; // Stop reconnecting
          },
        })
        .configureLogging(LogLevel.Warning) // Reduce logging to avoid spam
        .build();
        
      this.setupEventHandlers();
    } catch (error) {
      console.warn('SignalR initialization failed:', error);
      console.warn('Real-time notifications will not work. Install: npm install react-native-url-polyfill');
      this.connection = null;
      return;
    }
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    // Handle incoming notifications
    this.connection.on('ReceiveNotification', (notification: Notification) => {
      console.log('Received notification via SignalR:', notification);
      
      // Validate notification data before adding
      if (notification && notification.notificationId) {
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification(notification);
        
        // You can add push notification or other UI feedback here
        this.showNotificationToUser(notification);
      } else {
        console.warn('Invalid notification received:', notification);
      }
    });

    // Connection events
    this.connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.reconnectAttempts = 0;
    });

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.reconnectAttempts = 0;
      this.joinUserGroup();
    });
  }

  async connect(): Promise<void> {
    if (this.isDisabled || !this.connection || this.isConnecting) {
      console.log('SignalR: Cannot connect - disabled, no connection, or already connecting');
      return;
    }

    if (this.connection.state === 'Connected') {
      console.log('SignalR: Already connected');
      return;
    }

    try {
      this.isConnecting = true;
      await this.connection.start();
      console.log('SignalR connected successfully');
      
      // Join user-specific group
      await this.joinUserGroup();
      
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('SignalR connection failed:', error);
      
      // If pathname error occurs, disable SignalR
      if (error && error.toString().includes('pathname')) {
        console.warn('SignalR disabled due to pathname error. Using API-based notifications only.');
        this.isDisabled = true;
        return;
      }
      
      // Retry connection with exponential backoff
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
        console.warn('SignalR max reconnection attempts reached. Using API-based notifications only.');
        this.isDisabled = true;
      }
    } finally {
      this.isConnecting = false;
    }
  }

  private async joinUserGroup(): Promise<void> {
    if (!this.connection || this.connection.state !== 'Connected') {
      return;
    }

    try {
      const authStore = useAuthStore.getState();
      const user = authStore.user;

      if (user?.accountId) {
        // Join user-specific group: User_{AccountId}
        await this.connection.invoke('JoinGroup', `User_${user.accountId}`);
        console.log('Joined notification group for account ID: ' + String(user.accountId));
      }
    } catch (error) {
      console.error('Failed to join user group:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    try {
      await this.connection.stop();
      console.log('SignalR disconnected');
    } catch (error) {
      console.error('Error disconnecting SignalR:', error);
    }
  }

  private showNotificationToUser(notification: Notification) {
    // You can implement push notifications, toast, or other UI feedback here
    // For now, we'll just log it
    console.log('New notification received:', {
      title: notification.notificationTitle || 'No title',
      message: notification.notificationMessage || 'No message',
      type: notification.notificationType
    });
    
    // Example: Show a toast notification
    // const { showInfoToast } = require('../components').useToast();
    // showInfoToast(notification.notificationTitle);
  }

  // Get connection state
  getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  // Check if connected
  isConnected(): boolean {
    return !this.isDisabled && this.connection?.state === 'Connected';
  }

  // Check if SignalR is available
  isAvailable(): boolean {
    return !this.isDisabled && this.connection !== null;
  }

  // Manual reconnect
  async reconnect(): Promise<void> {
    if (this.isDisabled) {
      console.log('SignalR is disabled, cannot reconnect');
      return;
    }
    await this.disconnect();
    this.reconnectAttempts = 0;
    await this.connect();
  }
}

// Export singleton instance
export const signalrService = new SignalRService(); 