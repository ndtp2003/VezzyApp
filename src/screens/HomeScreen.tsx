import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { useEventStore } from '../store/eventStore';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme, spacing, borderRadius, typography, shadows } from '../theme';
import { formatTokenExpiry, getTokenStatus, logTokenDebugInfo } from '../utils/tokenManager';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { 
    user, 
    accessToken, 
    refreshToken, 
    accessTokenExpiresAt, 
    refreshTokenExpiresAt,
    ensureValidToken,
    refreshAuthToken
  } = useAuthStore();
  const { dashboardStats, fetchDashboardStats, isLoading } = useEventStore();
  const { theme } = useSettingsStore();
  const [showTokenDebug, setShowTokenDebug] = useState(__DEV__);
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleRefresh = () => {
    fetchDashboardStats();
  };

  const handleScanQR = () => {
    // Navigate to QR Scanner - will be implemented when we create the QR scanner
    console.log('Navigate to QR Scanner');
  };

  const handleViewAllEvents = () => {
    navigation.navigate('Events' as never);
  };

  const handleTestTokenValidation = async () => {
    try {
      const isValid = await ensureValidToken();
      Alert.alert(
        'Token Validation Test',
        `Token is ${isValid ? 'valid' : 'invalid'}\n\nCheck console for debug info`
      );
      logTokenDebugInfo(accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt);
    } catch (error) {
      Alert.alert('Error', `Token validation failed: ${error}`);
    }
  };

  const handleManualRefresh = async () => {
    try {
      await refreshAuthToken();
      Alert.alert('Success', 'Token refreshed successfully!');
      logTokenDebugInfo(accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt);
    } catch (error) {
      Alert.alert('Error', `Token refresh failed: ${error}`);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={currentTheme.primary}
        />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>
          {t('home.welcome')}, {user?.fullName || user?.username}!
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon 
              name="event" 
              size={32} 
              color={currentTheme.primary} 
              style={styles.statIcon} 
            />
            <Text style={styles.statNumber}>
              {dashboardStats?.totalEvents || 0}
            </Text>
            <Text style={styles.statLabel}>{t('home.totalEvents')}</Text>
          </View>

          <View style={styles.statCard}>
            <Icon 
              name="check-circle" 
              size={32} 
              color={currentTheme.success} 
              style={styles.statIcon} 
            />
            <Text style={styles.statNumber}>
              {dashboardStats?.totalCheckIns || 0}
            </Text>
            <Text style={styles.statLabel}>{t('home.totalCheckins')}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon 
              name="today" 
              size={32} 
              color={currentTheme.primary} 
              style={styles.statIcon} 
            />
            <Text style={styles.statNumber}>
              {dashboardStats?.todayCheckIns || 0}
            </Text>
            <Text style={styles.statLabel}>{t('home.todayCheckins')}</Text>
          </View>

          <View style={styles.statCard}>
            <Icon 
              name="trending-up" 
              size={32} 
              color={currentTheme.success} 
              style={styles.statIcon} 
            />
            <Text style={styles.statNumber}>
              {dashboardStats?.thisWeekCheckIns || 0}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
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

      {/* Token Debug Section (Development Only) */}
      {showTokenDebug && (
        <View style={styles.debugSection}>
          <TouchableOpacity 
            onPress={() => setShowTokenDebug(!showTokenDebug)}
            style={styles.debugToggle}
          >
            <Text style={styles.debugTitle}>Token Debug Info</Text>
          </TouchableOpacity>
          
          <View style={styles.debugCard}>
            <Text style={styles.debugText}>
              Access Token: {getTokenStatus(accessTokenExpiresAt)}
            </Text>
            <Text style={styles.debugText}>
              Expires: {formatTokenExpiry(accessTokenExpiresAt)}
            </Text>
            <Text style={styles.debugText}>
              Refresh Token: {getTokenStatus(refreshTokenExpiresAt)}
            </Text>
            <Text style={styles.debugText}>
              Expires: {formatTokenExpiry(refreshTokenExpiresAt)}
            </Text>
          </View>

          <View style={styles.debugActions}>
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={handleTestTokenValidation}
            >
              <Text style={styles.debugButtonText}>Test Token</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={handleManualRefresh}
            >
              <Text style={styles.debugButtonText}>Refresh Token</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    ...shadows.md,
  },
  statIcon: {
    marginBottom: spacing.sm,
  },
  statNumber: {
    ...typography.h2,
    color: theme.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
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
  // Debug styles (development only)
  debugSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: theme.card,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  debugToggle: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  debugTitle: {
    ...typography.h5,
    color: theme.primary,
    fontWeight: 'bold',
  },
  debugCard: {
    backgroundColor: theme.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.sm,
  },
  debugText: {
    ...typography.body2,
    color: theme.textSecondary,
    marginBottom: spacing.xs,
  },
  debugActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  debugButton: {
    backgroundColor: theme.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  debugButtonText: {
    ...typography.button,
    color: theme.background,
    fontSize: 12,
  },
});

export default HomeScreen; 