/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { useTranslation } from 'react-i18next';
import './src/utils/i18n';
import { useAuthStore } from './src/store/authStore';
import { useLoadingStore } from './src/store/loadingStore';
import { useLanguageSync } from './src/hooks/useLanguageSync';
import RootNavigator from './src/navigation/RootNavigator';
import { ToastProvider } from './src/components/ToastManager';
import LoadingSpinner from './src/components/LoadingSpinner';

// Ignore specific LogBox warnings
LogBox.ignoreLogs([
  'Encountered two children with the same key',
  'VirtualizedLists should never be nested',
  'Warning: AsyncStorage has been extracted',
  'Setting a timer for a long period of time',
  'Remote debugger is in a background tab',
]);

function App(): React.JSX.Element {
  const { checkAuthStatus } = useAuthStore();
  const { isLoading, loadingMessage } = useLoadingStore();
  
  // Sync language changes with i18n
  useLanguageSync();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <ToastProvider>
      <StatusBar barStyle="default" />
      <RootNavigator />
      <LoadingSpinner 
        visible={isLoading} 
        message={loadingMessage} 
      />
    </ToastProvider>
  );
}

export default App;
