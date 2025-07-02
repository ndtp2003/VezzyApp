import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { initializeNotifications } from '../store/notificationStore';
import { useSignalR } from '../hooks/useSignalR';
import { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import QRScannerScreen from '../screens/QRScannerScreen';
import CheckInHistoryScreen from '../screens/CheckInHistoryScreen';
import FaceScannerScreen from '../screens/FaceScannerScreen';
import SplashScreen from '../screens/SplashScreen';
import { lightTheme, darkTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  const { theme } = useSettingsStore();
  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Initialize SignalR for real-time notifications
  useSignalR();
  
  useEffect(() => {
    const performAuthCheck = async () => {
      try {
        // Add small delay to ensure zustand persist rehydration is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        await checkAuthStatus();
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        setAuthChecked(true);
      }
    };
    
    performAuthCheck();
  }, [checkAuthStatus]);

  // Separate effect để auto-fetch notifications sau khi auth check hoàn tất và user authenticated
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      initializeNotifications().catch(() => {
        // Silent failure
      });
    }
  }, [authChecked, isAuthenticated]);

  // Handle splash screen completion - only after auth check is done
  const handleSplashFinish = () => {
    if (authChecked) {
      setShowSplash(false);
    }
  };

  const getTheme = () => {
    if (theme === 'system') {
      // In a real app, you'd use Appearance.getColorScheme() from react-native
      return lightTheme;
    }
    return theme === 'dark' ? darkTheme : lightTheme;
  };

  const navigationTheme = {
    dark: theme === 'dark',
    colors: {
      primary: getTheme().primary,
      background: getTheme().background,
      card: getTheme().card,
      text: getTheme().text,
      border: getTheme().border,
      notification: getTheme().notification,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '900' as const },
    },
  };

  // Show splash screen until auth check is complete
  if (showSplash || isLoading || !authChecked) {
    return <SplashScreen onFinish={handleSplashFinish} canFinish={authChecked} />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {/* @ts-ignore */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen 
              name="QRScanner" 
              component={QRScannerScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="CheckInHistory" 
              component={CheckInHistoryScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="FaceScanner" 
              component={FaceScannerScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator; 
