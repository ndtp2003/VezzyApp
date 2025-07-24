import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { Notification, NotificationType } from '../types';
import { Theme } from '../theme';

interface NotificationDetailModalProps {
  visible: boolean;
  notification: Notification | null;
  onClose: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  theme: Theme;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  visible,
  notification,
  onClose,
  onMarkAsRead,
  theme,
}) => {
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const hasMarkedAsRead = React.useRef(false);

  // Auto mark as read when modal is shown
  React.useEffect(() => {
    if (
      visible &&
      notification &&
      !notification.isRead &&
      onMarkAsRead &&
      !hasMarkedAsRead.current
    ) {
      onMarkAsRead(notification.notificationId);
      hasMarkedAsRead.current = true;
    }
    if (!visible) {
      hasMarkedAsRead.current = false;
    }
  }, [visible, notification, onMarkAsRead]);

  if (!notification) return null;

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Get notification type label
  const getNotificationTypeLabel = (type: NotificationType): string => {
    try {
      const typeKey = NotificationType[type] as keyof typeof NotificationType;
      if (!typeKey) {
        return t('notifications.types.Other');
      }
      const labelKey = 'notifications.types.' + String(typeKey);
      const label = t(labelKey);
      return label || t('notifications.types.Other');
    } catch {
      return t('notifications.types.Other');
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
        return 'wallet';
      case NotificationType.WithdrawalRejected:
        return 'card';
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
        return 'analytics';
      case NotificationType.WithdrawalRequested:
      case NotificationType.AdminWithdrawalRequest:
        return 'cash';
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
        return '#22c55e'; // green
      case NotificationType.EventRejectedByAdmin:
      case NotificationType.WithdrawalRejected:
        return '#ef4444'; // red
      case NotificationType.EventManagerNewEvent:
      case NotificationType.AdminNewEvent:
      case NotificationType.EventManagerUpdateEvent:
        return '#3b82f6'; // blue
      case NotificationType.EventManagerNewPost:
      case NotificationType.AdminNewReport:
        return '#f59e0b'; // amber
      case NotificationType.WithdrawalRequested:
      case NotificationType.AdminWithdrawalRequest:
        return '#8b5cf6'; // purple
      default:
        return theme.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Icon
                    name={getNotificationIcon(notification.notificationType)}
                    size={24}
                    color={getNotificationIconColor(notification.notificationType)}
                  />
                </View>
                <Text style={styles.modalTitle}>{t('notifications.detail.title')}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Icon name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('notifications.detail.subject')}</Text>
                <Text style={styles.notificationTitle}>
                  {notification.notificationTitle || t('notifications.detail.noTitle')}
                </Text>
              </View>

              {/* Message */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('notifications.detail.message')}</Text>
                <Text style={styles.notificationMessage}>
                  {notification.notificationMessage || t('notifications.detail.noMessage')}
                </Text>
              </View>

              {/* Type */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('notifications.detail.type')}</Text>
                <View style={styles.typeContainer}>
                  <Icon
                    name={getNotificationIcon(notification.notificationType)}
                    size={16}
                    color={getNotificationIconColor(notification.notificationType)}
                  />
                  <Text style={styles.notificationType}>
                    {getNotificationTypeLabel(notification.notificationType)}
                  </Text>
                </View>
              </View>

              {/* Time */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('notifications.detail.receivedAt')}</Text>
                <Text style={styles.notificationTime}>
                  {formatDate(notification.createdAtVietnam || notification.createdAt)}
                </Text>
              </View>

              {/* Read Status */}
              {notification.readAt && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>{t('notifications.detail.readAt')}</Text>
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.readAtVietnam || notification.readAt)}
                  </Text>
                </View>
              )}

              {/* Redirect URL if available */}
              {notification.redirectUrl && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>{t('notifications.detail.link')}</Text>
                  <Text style={styles.redirectUrl} numberOfLines={2}>
                    {notification.redirectUrl}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeFooterButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeFooterButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: theme.card,
      borderRadius: 16,
      maxHeight: '80%',
      width: '100%',
      maxWidth: 400,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      marginRight: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    modalContent: {
      padding: 20,
      maxHeight: 400,
    },
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      lineHeight: 22,
    },
    notificationMessage: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 20,
    },
    typeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationType: {
      fontSize: 14,
      color: theme.text,
      marginLeft: 8,
      fontWeight: '500',
    },
    notificationTime: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    redirectUrl: {
      fontSize: 12,
      color: theme.primary,
      fontFamily: 'monospace',
    },
    modalFooter: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    closeFooterButton: {
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeFooterButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default NotificationDetailModal; 