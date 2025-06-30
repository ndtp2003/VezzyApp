import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { RootStackParamList } from '../types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import QRScannerScreen from '../screens/QRScannerScreen';
import { lightTheme, darkTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  const { theme } = useSettingsStore();
  
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

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

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: getTheme().background 
      }}>
        <ActivityIndicator size="large" color={getTheme().primary} />
      </View>
    );
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
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator; 
