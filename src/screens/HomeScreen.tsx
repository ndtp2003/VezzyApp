import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useLanguageSync } from '../hooks/useLanguageSync';
import { lightTheme, darkTheme, spacing, borderRadius, typography, shadows } from '../theme';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { theme } = useSettingsStore();
  
  // Sync language with user config
  useLanguageSync();
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  const handleScanQR = () => {
    // Navigate to QR Scanner
    navigation.navigate('QRScanner' as never);
  };

  const handleViewAllEvents = () => {
    navigation.navigate('Events' as never);
  };

    return (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>
          {t('home.welcome')}, {user?.fullName || user?.username}!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          {t('home.collaboratorWelcome')}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleScanQR}>
          <Icon name="qr-code-scanner" size={24} color={currentTheme.background} />
          <Text style={styles.actionButtonText}>{t('home.scanQRCode')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryActionButton]} 
          onPress={handleViewAllEvents}
        >
          <Icon name="event" size={24} color={currentTheme.primary} />
          <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>
            {t('home.viewAllEvents')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  welcomeSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: theme.surface,
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    ...typography.h3,
    color: theme.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.body1,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: theme.text,
    marginBottom: spacing.lg,
  },
  actionButton: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  actionButtonText: {
    ...typography.button,
    color: theme.background,
    marginLeft: spacing.sm,
  },
  secondaryActionButtonText: {
    color: theme.primary,
  },
});

export default HomeScreen; 