import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useLanguageSync } from '../hooks/useLanguageSync';
import { lightTheme, darkTheme, spacing, borderRadius, typography, shadows } from '../theme';
import { apiService } from '../services/api';
import { CollaboratorStaticResponse } from '../types';
import { useNotificationStore } from '../store/notificationStore';
import { useEventStore } from '../store/eventStore';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, shouldRefreshHomeStats, resetHomeStatsRefresh } = useAuthStore();
  const { theme } = useSettingsStore();
  const collaboratorStats = useEventStore(state => state.collaboratorStats);
  const isFocused = useIsFocused();
  
  // Sync language with user config
  useLanguageSync();
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  // StatBox component đặt bên trong HomeScreen để dùng được styles
  function StatBox({ icon, labelKey, value, color, t, style }: { icon: string, labelKey: string, value: number, color: string, t: any, style?: any }) {
    return (
      <View style={[styles.statBox, style, { backgroundColor: currentTheme.surface, shadowColor: currentTheme.text }]}> 
        <Icon name={icon} size={32} color={color} style={{ marginBottom: 6 }} />
        <Text style={[styles.statValue, { color: currentTheme.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>{t(`home.stats.${labelKey}`)}</Text>
      </View>
    );
  }

  const handleScanQR = () => {
    // Navigate to QR Scanner
    navigation.navigate('QRScanner' as never);
  };

  const handleViewAllEvents = () => {
    navigation.navigate('Events' as never);
  };

  const handleManualRefresh = async () => {
    if (!user?.userId) return;
    setLoadingStats(true);
    setStatsError(null);
    try {
      const res = await apiService.getCollaboratorStatic(user.userId);
      setStats(res);
    } catch (e: any) {
      setStatsError(e?.response?.data?.message || 'Lỗi khi lấy thống kê');
    } finally {
      setLoadingStats(false);
    }
  };

  const [stats, setStats] = useState<CollaboratorStaticResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Initialize stats with default values to maintain UI structure
  const defaultStats: CollaboratorStaticResponse = {
    totalEvents: 0,
    ongoingEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalCheckIns: 0,
    generatedAt: new Date().toISOString(),
  };

  const displayStats = stats || defaultStats;

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.userId) return;
      setLoadingStats(true);
      setStatsError(null);
      try {
        const res = await apiService.getCollaboratorStatic(user.userId);
        setStats(res);
      } catch (e: any) {
        setStatsError(e?.response?.data?.message || 'Lỗi khi lấy thống kê');
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [user?.userId]);

  // Realtime: cập nhật dashboard khi có event SignalR
  useEffect(() => {
    if (collaboratorStats) {
      setStats(collaboratorStats);
    }
  }, [collaboratorStats]);

  // Refresh stats when returning to HomeScreen after successful check-in
  useEffect(() => {
    if (isFocused && shouldRefreshHomeStats) {
      // Reset the flag first
      resetHomeStatsRefresh();
      
      // Refresh stats
      const fetchStats = async () => {
        if (!user?.userId) return;
        setLoadingStats(true);
        setStatsError(null);
        try {
          const res = await apiService.getCollaboratorStatic(user.userId);
          setStats(res);
        } catch (e: any) {
          setStatsError(e?.response?.data?.message || 'Lỗi khi lấy thống kê');
        } finally {
          setLoadingStats(false);
        }
      };
      
      fetchStats();
    }
  }, [isFocused, shouldRefreshHomeStats, user?.userId, resetHomeStatsRefresh]);

  // Alternative approach: Listen to navigation focus events
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (shouldRefreshHomeStats) {
        resetHomeStatsRefresh();
        
        const fetchStats = async () => {
          if (!user?.userId) return;
          setLoadingStats(true);
          setStatsError(null);
          try {
            const res = await apiService.getCollaboratorStatic(user.userId);
            setStats(res);
          } catch (e: any) {
            setStatsError(e?.response?.data?.message || 'Lỗi khi lấy thống kê');
          } finally {
            setLoadingStats(false);
          }
        };
        
        fetchStats();
      }
    });

    return unsubscribe;
  }, [navigation, shouldRefreshHomeStats, user?.userId, resetHomeStatsRefresh]);

  // Use useFocusEffect as backup approach
  useFocusEffect(
    useCallback(() => {
      if (shouldRefreshHomeStats) {
        resetHomeStatsRefresh();
        
        const fetchStats = async () => {
          if (!user?.userId) return;
          setLoadingStats(true);
          setStatsError(null);
          try {
            const res = await apiService.getCollaboratorStatic(user.userId);
            setStats(res);
          } catch (e: any) {
            setStatsError(e?.response?.data?.message || 'Lỗi khi lấy thống kê');
          } finally {
            setLoadingStats(false);
          }
        };
        
        fetchStats();
      }
    }, [shouldRefreshHomeStats, user?.userId, resetHomeStatsRefresh])
  );

  // Additional check with delay after focus
  useEffect(() => {
    if (isFocused) {
      const timer = setTimeout(() => {
        const currentFlag = useAuthStore.getState().shouldRefreshHomeStats;
        if (currentFlag) {
          resetHomeStatsRefresh();
          
          const fetchStats = async () => {
            if (!user?.userId) return;
            setLoadingStats(true);
            setStatsError(null);
            try {
              const res = await apiService.getCollaboratorStatic(user.userId);
              setStats(res);
            } catch (e: any) {
              setStatsError(e?.response?.data?.message || 'Lỗi khi lấy thống kê');
            } finally {
              setLoadingStats(false);
            }
          };
          
          fetchStats();
        }
      }, 500); // 500ms delay
      
      return () => clearTimeout(timer);
    }
  }, [isFocused, user?.userId, resetHomeStatsRefresh]);

  const unreadCount = useNotificationStore(state => state.unreadCount || 0);

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>
          {t('home.welcome')}, {user?.fullName || user?.username}!
        </Text>
        {/* <Text style={styles.welcomeSubtitle}>
          {t('home.collaboratorWelcome')}
        </Text> */}
      </View>

      {/* Section thống kê collaborator */}
      <View style={[styles.statsCard, { backgroundColor: currentTheme.surface }]}>
        <View style={styles.statsHeader}>
          <Text style={[styles.statsTitle, { color: currentTheme.primary }]}>{t('home.stats.title')}</Text>
          <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
            <Icon name="refresh" size={20} color={currentTheme.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Always show stats grid, only show loading indicator on top */}
        {loadingStats && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={currentTheme.primary} />
          </View>
        )}
        
        {statsError ? (
          <Text style={[styles.statsError, { color: currentTheme.error }]}>{statsError}</Text>
        ) : (
          <View style={styles.statsGrid}>
            {[
              { icon: "event", key: "totalEvents", value: displayStats.totalEvents, color: currentTheme.primary },
              { icon: "play-circle", key: "ongoingEvents", value: displayStats.ongoingEvents, color: currentTheme.success },
              { icon: "schedule", key: "upcomingEvents", value: displayStats.upcomingEvents, color: currentTheme.primary },
              { icon: "check-circle", key: "completedEvents", value: displayStats.completedEvents, color: currentTheme.success },
              { icon: "how-to-reg", key: "totalCheckIns", value: displayStats.totalCheckIns, color: currentTheme.primary },
              { icon: "notifications", key: "unreadNotifications", value: unreadCount, color: currentTheme.primary },
            ].map((item, idx) => (
              <StatBox
                key={item.key}
                icon={item.icon}
                labelKey={item.key}
                value={item.value}
                color={item.color}
                t={t}
                style={{
                  width: '48%',
                  margin: '1%',
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>{t('home.quickActions.title')}</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={[styles.quickActionBtn, { marginRight: 8 }]} onPress={handleScanQR}>
            <Icon name="qr-code-scanner" size={24} color={currentTheme.background} />
            <Text style={styles.quickActionText}>{t('home.scanQRCode')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={handleViewAllEvents}>
            <Icon name="event" size={24} color={currentTheme.background} />
            <Text style={[styles.quickActionText]}>{t('home.viewAllEvents')}</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: theme.surface,
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    ...typography.h4,
    color: theme.text,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    ...typography.body1,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2', // sẽ override bằng currentTheme.primary trong JSX
    borderRadius: 12,
    paddingVertical: 14,
  },
  quickActionText: {
    color: '#fff', // sẽ override bằng currentTheme.background trong JSX
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
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
  statsCard: {
    borderRadius: 16,
    padding: 16,
    margin: 8,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#222', // sẽ override bằng currentTheme.surface trong JSX
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000', // sẽ override nếu cần
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#222', // sẽ override bằng currentTheme.text trong JSX
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#555', // sẽ override bằng currentTheme.textSecondary trong JSX
    textAlign: 'center',
  },
  statsError: {
    fontSize: 13,
    marginBottom: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    zIndex: 1,
  },
});

export default HomeScreen; 
