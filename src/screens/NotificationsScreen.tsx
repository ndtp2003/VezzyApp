import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../store/notificationStore';
import { useSettingsStore } from '../store/settingsStore';
import { useToast, NotificationDetailModal } from '../components';
import { lightTheme, darkTheme } from '../theme';
import { Notification, NotificationType } from '../types';
import Icon from 'react-native-vector-icons/Ionicons';
import NotificationDebug from '../components/NotificationDebug';

const NotificationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useSettingsStore();
  const { showSuccessToast, showErrorToast } = useToast();
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    hasMorePages,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setError,
    loadMockNotifications,
  } = useNotificationStore();

  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications(1, true);
    
    // Fallback to mock data if API fails (for development)
    // if (notifications.length === 0) {
    //   loadMockNotifications();
    // }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMorePages) {
      const currentPage = Math.ceil(notifications.length / 20) + 1;
      fetchNotifications(currentPage);
    }
  }, [isLoading, hasMorePages, notifications.length, fetchNotifications]);

  // Handle mark single notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      showSuccessToast(t('notifications.markAsRead'));
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to mark as read');
    }
  }, [markAsRead, showSuccessToast, showErrorToast, t]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      showSuccessToast(t('notifications.markAllAsRead'));
      setShowOptionsModal(false);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to mark all as read');
    }
  }, [markAllAsRead, showSuccessToast, showErrorToast, t]);

  // Handle notification press - show detail modal
  const handleNotificationPress = useCallback((notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  }, []);

  // Handle close detail modal
  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedNotification(null);
  }, []);

  // Confirm mark all as read
  const confirmMarkAllAsRead = () => {
    setShowConfirmModal(true);
  };

  // Handle confirm mark all as read
  const handleConfirmMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      showSuccessToast(t('notifications.markAllAsRead'));
      setShowConfirmModal(false);
      setShowOptionsModal(false);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to mark all as read');
    }
  }, [markAllAsRead, showSuccessToast, showErrorToast, t]);

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setShowOptionsModal(false);
  };

  // Get notification type label
  const getNotificationTypeLabel = (type: NotificationType): string => {
          try {
        const typeKey = NotificationType[type] as keyof typeof NotificationType;
        if (!typeKey) {
          return 'Notification';
        }
        const labelKey = 'notifications.types.' + String(typeKey);
        const label = t(labelKey);
        return label || 'Notification';
      } catch (error) {
        console.warn('Error getting notification type label:', error);
        return 'Notification';
      }
  };

  // Get notification icon
  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.EventApproved:
      case NotificationType.EventApprovedByAdmin:
        return 'checkmark-circle';
      case NotificationType.EventRejectedByAdmin:
        return 'close-circle';
      case NotificationType.PayoutProcessed:
      case NotificationType.WithdrawalApproved:
        return 'cash';
      case NotificationType.WithdrawalRejected:
        return 'close-circle-outline';
      case NotificationType.OrderSuccess:
        return 'bag-check';
      case NotificationType.EventManagerNewEvent:
      case NotificationType.AdminNewEvent:
        return 'calendar';
      case NotificationType.EventManagerUpdateEvent:
        return 'create';
      case NotificationType.EventManagerNewPost:
        return 'document-text';
      case NotificationType.AdminNewReport:
        return 'bar-chart';
      case NotificationType.WithdrawalRequested:
      case NotificationType.AdminWithdrawalRequest:
        return 'card';
      default:
        return 'notifications';
    }
  };

  // Get notification icon color
  const getNotificationIconColor = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.EventApproved:
      case NotificationType.EventApprovedByAdmin:
      case NotificationType.OrderSuccess:
      case NotificationType.PayoutProcessed:
      case NotificationType.WithdrawalApproved:
        return currentTheme.success;
      case NotificationType.EventRejectedByAdmin:
      case NotificationType.WithdrawalRejected:
        return currentTheme.error;
      case NotificationType.EventManagerNewEvent:
      case NotificationType.AdminNewEvent:
      case NotificationType.EventManagerUpdateEvent:
        return currentTheme.primary;
      default:
        return currentTheme.textSecondary;
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return 'Unknown';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInHours / 24;

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        if (diffInMinutes < 1) {
          return 'Just now';
        } else {
          return String(diffInMinutes) + 'm ago';
        }
      } else if (diffInHours < 24) {
        return String(Math.floor(diffInHours)) + 'h ago';
      } else if (diffInDays < 7) {
        return String(Math.floor(diffInDays)) + 'd ago';
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Unknown';
    }
  };

    // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }): React.ReactElement | null => {
    // Add safety check
    if (!item || typeof item !== 'object') {
      console.warn('Invalid notification item in render:', item);
      return null;
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadItem,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIcon}>
          <Icon
            name={getNotificationIcon(item.notificationType)}
            size={24}
            color={getNotificationIconColor(item.notificationType)}
          />
          {!item.isRead && <View style={styles.unreadBadge} />}
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>
              {item.notificationTitle || 'No Title'}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDate(item.createdAtVietnam || item.createdAt)}
            </Text>
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.notificationMessage || 'No message'}
          </Text>
          
          <Text style={styles.notificationType}>
            {getNotificationTypeLabel(item.notificationType)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = (): React.ReactElement => (
    <View style={styles.emptyContainer}>
      <Icon name="notifications-off" size={64} color={currentTheme.textSecondary} />
      <Text style={styles.emptyTitle}>{t('notifications.empty.title')}</Text>
      <Text style={styles.emptyMessage}>{t('notifications.empty.message')}</Text>
    </View>
  );

  // Render error state
  const renderErrorState = (): React.ReactElement => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={64} color={currentTheme.error} />
      <Text style={styles.errorTitle}>Error Loading Notifications</Text>
      <Text style={styles.errorMessage}>{error || 'Unknown error occurred'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications(1, true)}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Render footer loader
  const renderFooter = (): React.ReactElement | null => {
    if (!hasMorePages) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={currentTheme.primary} />
      </View>
    );
  };

  // Clear error when user interacts
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      {/* Debug Panel - Temporarily disabled 
      {__DEV__ && (
        <View style={{ maxHeight: 200, backgroundColor: '#f0f0f0' }}>
          <NotificationDebug />
        </View>
      )}
      */}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{String(unreadCount || 0)}</Text>
            </View>
          )}
        </View>
        
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => setShowOptionsModal(true)}
          >
            <Icon name="ellipsis-vertical" size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.notificationId}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[currentTheme.primary]}
              tintColor={currentTheme.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter()}
          ListEmptyComponent={!isLoading ? renderEmptyState() : null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={notifications.length === 0 ? styles.emptyListContainer : undefined}
        />
      )}

      {/* Loading overlay */}
      {isLoading && notifications.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={currentTheme.primary} />
          <Text style={styles.loadingText}>{t('notifications.loading')}</Text>
        </View>
      )}

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptionsModal(false)}>
          <View style={styles.optionsModal}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={confirmMarkAllAsRead}
            >
              <Icon name="checkmark-done" size={20} color={currentTheme.primary} />
              <Text style={styles.optionText}>{t('notifications.markAllRead')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        visible={showDetailModal}
        notification={selectedNotification}
        onClose={handleCloseDetailModal}
        onMarkAsRead={handleMarkAsRead}
        theme={currentTheme}
      />

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancelConfirm}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIconContainer}>
              <Icon name="checkmark-circle" size={48} color={currentTheme.primary} />
            </View>
            <Text style={styles.confirmTitle}>{t('notifications.markAllRead')}</Text>
            <Text style={styles.confirmMessage}>{t('notifications.markAllReadConfirm')}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={handleCancelConfirm}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonPrimary]}
                onPress={handleConfirmMarkAllAsRead}
              >
                <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginRight: 8,
    },
    unreadCountBadge: {
      backgroundColor: theme.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadCountText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    optionsButton: {
      padding: 8,
    },
    notificationItem: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.card,
    },
    unreadItem: {
      backgroundColor: theme.primary + '08',
    },
    notificationIcon: {
      marginRight: 12,
      position: 'relative',
    },
    unreadBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.error,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      flex: 1,
      marginRight: 8,
    },
    unreadText: {
      fontWeight: '600',
    },
    notificationTime: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    notificationMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
      marginBottom: 4,
    },
    notificationType: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyListContainer: {
      flexGrow: 1,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    footerLoader: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsModal: {
      backgroundColor: theme.card,
      borderRadius: 12,
      marginHorizontal: 32,
      minWidth: 200,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    optionText: {
      marginLeft: 12,
      fontSize: 16,
      color: theme.text,
    },
    confirmModal: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      width: '80%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    confirmIconContainer: {
      marginBottom: 16,
    },
    confirmTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    confirmMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    confirmButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
    },
    confirmButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    confirmButtonPrimary: {
      backgroundColor: theme.primary,
    },
    confirmButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: theme.border,
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
    },
});

export default NotificationsScreen; 
