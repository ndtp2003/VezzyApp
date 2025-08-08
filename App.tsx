/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import './src/utils/i18n';
import { initializeLanguage } from './src/utils/i18n';
import { useAuthStore } from './src/store/authStore';
import { useLoadingStore } from './src/store/loadingStore';
import { useSettingsStore } from './src/store/settingsStore';
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
  const [isLanguageInitialized, setIsLanguageInitialized] = useState(false);
  const { checkAuthStatus } = useAuthStore();
  const { isLoading, loadingMessage } = useLoadingStore();
  const { i18n } = useTranslation();
  const { language: settingsLanguage } = useSettingsStore();
  
  // Initialize language before rendering ANY components
  useEffect(() => {
    const initLanguage = async () => {
      try {
        // Wait a bit for Zustand persist to rehydrate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await initializeLanguage();
        setIsLanguageInitialized(true);
      } catch (error) {
        console.error('App: Failed to initialize language:', error);
        // Still set to true to prevent infinite loading
        setIsLanguageInitialized(true);
      }
    };
    initLanguage();
  }, [i18n, settingsLanguage]);

  // Sync language changes with i18n - only after language is initialized
  useLanguageSync();

  // Show loading screen until language is initialized
  if (!isLanguageInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#007AFF' // Blue background like splash
      }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

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
