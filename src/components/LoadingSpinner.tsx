import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme, spacing, borderRadius, typography } from '../theme';

interface LoadingSpinnerProps {
  visible: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  visible, 
  message 
}) => {
  const { t } = useTranslation();
  const { theme } = useSettingsStore();
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator 
            size="large" 
            color={currentTheme.primary} 
            style={styles.spinner}
          />
          <Text style={styles.message}>
            {message || t('common.loading')}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 120,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body2,
    color: theme.text,
    textAlign: 'center',
  },
});

export default LoadingSpinner; 
