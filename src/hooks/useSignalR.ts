import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { signalrService } from '../services/signalrService';

export const useSignalR = () => {
  const { isAuthenticated, user } = useAuthStore();
  const connectionStarted = useRef(false);

  useEffect(() => {
    const handleSignalRConnection = async () => {
      if (isAuthenticated && user && !connectionStarted.current) {
        try {
          await signalrService.connect();
          connectionStarted.current = true;
        } catch (error) {
          console.error('Failed to connect to SignalR:', error);
          connectionStarted.current = false;
        }
      } else if (!isAuthenticated && connectionStarted.current) {
        try {
          await signalrService.disconnect();
          connectionStarted.current = false;
        } catch (error) {
          console.error('Error disconnecting from SignalR:', error);
        }
      }
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