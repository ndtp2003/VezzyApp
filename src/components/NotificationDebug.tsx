import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

const NotificationDebug: React.FC = () => {
  const { notifications, unreadCount, isLoading, error } = useNotificationStore();
  const { user, isAuthenticated } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🐛 Notification Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auth Status:</Text>
        <Text style={styles.info}>Authenticated: {String(isAuthenticated)}</Text>
        <Text style={styles.info}>User ID: {user?.accountId || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Store:</Text>
        <Text style={styles.info}>Notifications count: {String(notifications.length)}</Text>
        <Text style={styles.info}>Unread count: {String(unreadCount)}</Text>
        <Text style={styles.info}>Loading: {String(isLoading)}</Text>
        <Text style={styles.info}>Error: {error || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Notifications:</Text>
        {notifications.slice(0, 3).map((notification, index) => (
          <View key={notification.notificationId || index} style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>
              {notification.notificationTitle || 'No title'}
            </Text>
            <Text style={styles.notificationMessage}>
              {notification.notificationMessage || 'No message'}
            </Text>
            <Text style={styles.notificationMeta}>
              Read: {String(notification.isRead)} | Type: {String(notification.notificationType)}
            </Text>
          </View>
        ))}
        {notifications.length === 0 && (
          <Text style={styles.info}>No notifications</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  info: {
    fontSize: 12,
    marginBottom: 4,
    color: '#333',
  },
  notificationItem: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  notificationTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    color: '#333',
  },
  notificationMessage: {
    fontSize: 11,
    marginBottom: 2,
    color: '#666',
  },
  notificationMeta: {
    fontSize: 10,
    color: '#999',
  },
});

export default NotificationDebug; 