import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { signalrService } from '../services/signalrService';

export const useSignalR = () => {
  const { isAuthenticated, user } = useAuthStore();
  const connectionStarted = useRef(false);

  useEffect(() => {
    const handleSignalRConnection = async () => {
      // Temporarily disable SignalR connection
      console.log('SignalR temporarily disabled - using API-based notifications only');
      return;

      /* 
      // Re-enable this code when backend SignalR is ready
      if (isAuthenticated && user && !connectionStarted.current) {
        try {
          await signalrService.connect();
          connectionStarted.current = true;
          console.log('SignalR connection established for account ID: ' + String(user.accountId));
        } catch (error) {
          console.error('Failed to connect to SignalR:', error);
          connectionStarted.current = false;
        }
      } else if (!isAuthenticated && connectionStarted.current) {
        try {
          await signalrService.disconnect();
          connectionStarted.current = false;
          console.log('SignalR connection closed');
        } catch (error) {
          console.error('Error disconnecting from SignalR:', error);
        }
      }
      */
    };

    handleSignalRConnection();

    // Cleanup on unmount
    return () => {
      if (connectionStarted.current) {
        signalrService.disconnect().catch((error) => {
          console.error('Error during SignalR cleanup:', error);
        });
        connectionStarted.current = false;
      }
    };
  }, [isAuthenticated, user?.accountId]);

  return {
    isConnected: signalrService.isConnected(),
    connectionState: signalrService.getConnectionState(),
    reconnect: signalrService.reconnect.bind(signalrService),
  };
}; 