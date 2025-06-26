import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useEventStore } from '../store/eventStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { Event, MainTabParamList } from '../types';
import { lightTheme, darkTheme, spacing, borderRadius, typography, shadows } from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';

type EventsScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Events'>;

const EventsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const { theme } = useSettingsStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const { user } = useAuthStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  
  const {
    events,
    isLoading,
    isRefreshing,
    error,
    loadEvents,
    refreshEvents,
    clearError,
  } = useEventStore();

  // Load initial data
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    refreshEvents();
  }, [refreshEvents]);

  // Handle event item press - show action modal
  const handleEventPress = useCallback((event: Event) => {
    setSelectedEvent(event);
    setShowActionModal(true);
  }, []);

  // Handle check-in history
  const handleCheckInHistory = useCallback(() => {
    setShowActionModal(false);
    if (selectedEvent) {
      Alert.alert(
        t('events.checkInHistory'),
        `${t('events.checkInHistory')} cho "${selectedEvent.eventName}"`,
        [{ text: t('common.ok') }]
      );
    }
  }, [selectedEvent, t]);

  // Handle face check-in
  const handleFaceCheckIn = useCallback(() => {
    setShowActionModal(false);
    if (selectedEvent) {
      Alert.alert(
        t('events.faceCheckIn'),
        `${t('events.faceCheckIn')} cho "${selectedEvent.eventName}"`,
        [{ text: t('common.ok') }]
      );
    }
  }, [selectedEvent, t]);

  // Handle QR Scanner (from action buttons)
  const handleQRScanner = useCallback((event: Event) => {
    try {
      (navigation as any).navigate('QRScanner', { eventId: event.eventId });
    } catch (error) {
      console.log('QR Scanner navigation:', event.eventId);
      Alert.alert(
        'QR Scanner',
        `Mở QR Scanner cho sự kiện: ${event.eventName}`,
        [{ text: t('common.ok') }]
      );
    }
  }, [navigation, t]);

  // Handle error
  useEffect(() => {
    if (error) {
      Alert.alert(
        t('common.error'),
        error,
        [
          {
            text: t('common.ok'),
            onPress: clearError,
          },
        ]
      );
    }
  }, [error, t, clearError]);

  // Helper functions
  const getStatusText = (status: string | any, t: any): string => {
    const statusStr = typeof status === 'string' ? status : String(status);
    switch (statusStr.toLowerCase()) {
      case 'approved':
        return t('events.status.approved');
      case 'pending':
        return t('events.status.pending');
      case 'cancelled':
        return t('events.status.cancelled');
      case 'completed':
        return t('events.status.completed');
      default:
        return statusStr;
    }
  };

  const getStatusBadgeStyle = (status: string | any) => {
    const statusStr = typeof status === 'string' ? status : String(status);
    switch (statusStr.toLowerCase()) {
      case 'approved':
        return { backgroundColor: currentTheme.success };
      case 'pending':
        return { backgroundColor: '#FF9500' };
      case 'cancelled':
        return { backgroundColor: currentTheme.error };
      case 'completed':
        return { backgroundColor: '#007AFF' };
      default:
        return { backgroundColor: currentTheme.disabled };
    }
  };

  // Render event item
  const renderEventItem = useCallback(({ item }: { item: Event }) => (
    <View style={styles.eventItemContainer}>
      <TouchableOpacity
        style={[styles.eventItem, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
        onPress={() => handleEventPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={[styles.eventTitle, { color: currentTheme.text }]} numberOfLines={2}>
              {item.eventName}
            </Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(item.isApproved)]}>
              <Text style={styles.statusText}>
                {getStatusText(item.isApproved, t)}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.eventDescription, { color: currentTheme.textSecondary }]} numberOfLines={3}>
            {item.eventDescription}
          </Text>
          
          <View style={styles.eventDetails}>
            <View style={styles.eventTime}>
              <Icon name="schedule" size={14} color={currentTheme.primary} />
              <Text style={[styles.timeLabel, { color: currentTheme.textSecondary }]}>
                {t('events.details.startTime')}:
              </Text>
              <Text style={[styles.timeText, { color: currentTheme.text }]}>
                {new Date(item.startAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            
            <View style={styles.eventTime}>
              <Icon name="schedule" size={14} color={currentTheme.textSecondary} />
              <Text style={[styles.timeLabel, { color: currentTheme.textSecondary }]}>
                {t('events.details.endTime')}:
              </Text>
              <Text style={[styles.timeText, { color: currentTheme.text }]}>
                {new Date(item.endAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            <Text style={[styles.tapToSelectText, { color: currentTheme.textSecondary }]}>
              {t('events.tapToSelect')}
            </Text>
            <Icon name="chevron-right" size={20} color={currentTheme.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  ), [handleEventPress, handleQRScanner, t, currentTheme]);

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Icon name="event" size={64} color={currentTheme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
        {t('events.empty.title')}
      </Text>
      <Text style={[styles.emptyMessage, { color: currentTheme.textSecondary }]}>
        {t('events.empty.message')}
      </Text>
    </View>
  ), [t, currentTheme]);

  if (isLoading && events.length === 0) {
    return <LoadingSpinner visible={true} message={t('events.loading')} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          {t('events.title')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: currentTheme.textSecondary }]}>
          {t('events.subtitle')}
        </Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item, index) => `event-${item.eventId}-${index}`}
        renderItem={renderEventItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[currentTheme.primary]}
            tintColor={currentTheme.primary}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={events.length === 0 ? styles.emptyContainer : styles.listContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                {selectedEvent?.eventName}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowActionModal(false)}
              >
                <Icon name="close" size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.actionOptions}>
              <TouchableOpacity
                style={[styles.actionOption, { borderColor: currentTheme.border }]}
                onPress={handleCheckInHistory}
              >
                <Icon name="history" size={32} color={currentTheme.primary} />
                <Text style={[styles.actionOptionTitle, { color: currentTheme.text }]}>
                  {t('events.checkInHistory')}
                </Text>
                <Text style={[styles.actionOptionDesc, { color: currentTheme.textSecondary }]}>
                  {t('events.checkInHistoryDesc')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionOption, { borderColor: currentTheme.border }]}
                onPress={handleFaceCheckIn}
              >
                <Icon name="face" size={32} color={currentTheme.primary} />
                <Text style={[styles.actionOptionTitle, { color: currentTheme.text }]}>
                  {t('events.faceCheckIn')}
                </Text>
                <Text style={[styles.actionOptionDesc, { color: currentTheme.textSecondary }]}>
                  {t('events.faceCheckInDesc')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  eventItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  eventItem: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    marginRight: 8,
    minWidth: 70,
  },
  timeText: {
    fontSize: 12,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  tapToSelectText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  actionOptions: {
    gap: 20,
  },
  actionOption: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionOptionDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventCreator: {
    fontSize: 12,
    marginLeft: 6,
  },
  quickQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickQRText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default EventsScreen; 