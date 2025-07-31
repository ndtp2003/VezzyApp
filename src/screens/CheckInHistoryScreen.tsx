import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CheckInLogItem, CheckInHistoryResponse, QRCodeDetailResponse, RootStackParamList } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme, spacing, borderRadius, typography } from '../theme';
import { apiService } from '../services/api';
import { useToast } from '../components';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCheckInStore } from '../store/checkInStore';

type CheckInHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type CheckInHistoryScreenRouteProp = RouteProp<RootStackParamList, 'CheckInHistory'>;

interface RouteParams {
  eventId: string;
  eventName: string;
}

const CheckInHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<CheckInHistoryScreenNavigationProp>();
  const route = useRoute<CheckInHistoryScreenRouteProp>();
  const { theme } = useSettingsStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const { showSuccessToast, showErrorToast } = useToast();
  
  const { eventId, eventName } = (route.params as RouteParams) || {};
  
  // State
  const [checkInHistory, setCheckInHistory] = useState<CheckInLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQRCode, setSearchQRCode] = useState('');
  const [showQRSearch, setShowQRSearch] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const checkInHistoryRealtime = useCheckInStore(state => state.checkInHistory);

  const styles = createStyles(currentTheme);

  // Load check-in history - Simplified dependencies
  const loadCheckInHistory = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setCheckInHistory([]);
      } else {
        setIsLoadingMore(true);
      }

      const response: CheckInHistoryResponse = await apiService.getCheckInHistory(eventId, page, 20);
      
      if (response.isSuccess) {
        const newItems = response.data.items;
        
        if (reset) {
          setCheckInHistory(newItems);
        } else {
          setCheckInHistory(prev => [...prev, ...newItems]);
        }
        
        setHasNextPage(response.data.hasNextPage);
        setCurrentPage(response.data.pageNumber);
        setTotalItems(response.data.totalItems);
      } else {
        // Use Alert instead of showErrorToast to avoid dependency
        Alert.alert(t('common.error'), response.message || t('checkInHistory.loadError'));
      }
    } catch (error: any) {
      console.error('Error loading check-in history:', error);
      Alert.alert(t('common.error'), t('checkInHistory.loadError'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [eventId, t]); // Remove showErrorToast dependency

  // Search QR Code
  const searchByQRCode = useCallback(async () => {
    if (!searchQRCode.trim()) {
      showErrorToast(t('checkInHistory.enterQRCode'));
      return;
    }

    try {
      setIsSearching(true);
      const response: QRCodeDetailResponse = await apiService.getQRCodeDetail(searchQRCode.trim());
      
      if (response.isSuccess) {
        setSearchResult(response.data);
        showSuccessToast(t('checkInHistory.searchSuccess'));
      } else {
        showErrorToast(response.message || t('checkInHistory.searchError'));
      }
    } catch (error: any) {
      console.error('Error searching QR code:', error);
      showErrorToast(t('checkInHistory.searchError'));
    } finally {
      setIsSearching(false);
    }
  }, [searchQRCode, showErrorToast, showSuccessToast, t]);

  // Initial load - Now safe to include loadCheckInHistory
  useEffect(() => {
    if (eventId) {
      loadCheckInHistory(1, true);
    }
  }, [eventId, loadCheckInHistory]); // Safe now with reduced dependencies

  // Realtime: cập nhật lịch sử check-in khi có event SignalR
  useEffect(() => {
    if (checkInHistoryRealtime && checkInHistoryRealtime.length > 0) {
      setCheckInHistory(checkInHistoryRealtime);
    }
  }, [checkInHistoryRealtime]);

  // Handle refresh - Now safe to include loadCheckInHistory
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCheckInHistory(1, true);
  }, [loadCheckInHistory]);

  // Handle load more - Now safe to include loadCheckInHistory  
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isLoadingMore) {
      loadCheckInHistory(currentPage + 1, false);
    }
  }, [hasNextPage, isLoadingMore, currentPage, loadCheckInHistory]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('checkInHistory.notCheckedIn');
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'checked in':
        return currentTheme.success;
      case 'not checked in':
        return '#FF9500';
      case 'not found':
        return currentTheme.error;
      default:
        return currentTheme.textSecondary;
    }
  };

  // Get check-in method icon
  const getCheckInMethodIcon = (method: string) => {
    switch (method) {
      case 'QrCode':
        return 'qr-code-scanner';
      case 'FaceRecognition':
        return 'face';
      default:
        return 'check-circle';
    }
  };

  // Render check-in item
  const renderCheckInItem = ({ item }: { item: CheckInLogItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <View style={styles.qrCodeContainer}>
          <Icon name="confirmation-number" size={20} color={currentTheme.primary} />
          <Text style={styles.qrCodeText}>{item.qrCode}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.itemContent}>
        <View style={styles.infoRow}>
          <Icon name="person" size={16} color={currentTheme.textSecondary} />
          <Text style={styles.infoLabel}>{t('checkInHistory.customer')}:</Text>
          <Text style={styles.infoValue}>{item.customerName || item.customerEmail || t('checkInHistory.unknown')}</Text>
        </View>

        {item.checkedInAt && (
          <>
            <View style={styles.infoRow}>
              <Icon name="schedule" size={16} color={currentTheme.textSecondary} />
              <Text style={styles.infoLabel}>{t('checkInHistory.checkedInAt')}:</Text>
              <Text style={styles.infoValue}>{formatDate(item.checkedInAt)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name={getCheckInMethodIcon(item.checkInMethod)} size={16} color={currentTheme.textSecondary} />
              <Text style={styles.infoLabel}>{t('checkInHistory.method')}:</Text>
              <Text style={styles.infoValue}>{t(`checkInHistory.methods.${item.checkInMethod.toLowerCase()}`)}</Text>
            </View>

            {item.checkerName && (
              <View style={styles.infoRow}>
                <Icon name="person-outline" size={16} color={currentTheme.textSecondary} />
                <Text style={styles.infoLabel}>{t('checkInHistory.checkedBy')}:</Text>
                <Text style={styles.infoValue}>{item.checkerName}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );

  // Render QR search modal
  const renderQRSearchModal = () => (
    <Modal
      visible={showQRSearch}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowQRSearch(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('checkInHistory.searchByQR')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQRSearch(false)}
            >
              <Icon name="close" size={24} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('checkInHistory.enterQRCode')}
              placeholderTextColor={currentTheme.textSecondary}
              value={searchQRCode}
              onChangeText={setSearchQRCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.modalSearchButton, isSearching && styles.searchButtonDisabled]}
              onPress={searchByQRCode}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Icon name="search" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {searchResult && (
            <View style={styles.searchResultContainer}>
              <Text style={styles.searchResultTitle}>{t('checkInHistory.searchResult')}</Text>
              
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultQRCode}>{searchResult.qrCode}</Text>
                  <View style={[styles.resultStatusBadge, { backgroundColor: getStatusColor(searchResult.status) }]}>
                    <Text style={styles.resultStatusText}>{searchResult.status}</Text>
                  </View>
                </View>

                <Text style={styles.resultMessage}>{searchResult.message}</Text>

                {searchResult.isCheckedIn && (
                  <View style={styles.resultDetails}>
                    <Text style={styles.resultDetailText}>
                      {t('checkInHistory.checkedInAt')}: {formatDate(searchResult.checkedInAt)}
                    </Text>
                    {searchResult.checkerName && (
                      <Text style={styles.resultDetailText}>
                        {t('checkInHistory.checkedBy')}: {searchResult.checkerName}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render list footer
  const renderListFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={currentTheme.primary} />
        <Text style={styles.loadingText}>{t('common.loadingMore')}</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="history" size={64} color={currentTheme.textSecondary} />
      <Text style={styles.emptyTitle}>{t('checkInHistory.emptyTitle')}</Text>
      <Text style={styles.emptyMessage}>{t('checkInHistory.emptyMessage')}</Text>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner visible={true} message={t('checkInHistory.loading')} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={currentTheme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('checkInHistory.title')}</Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowQRSearch(true)}
          >
            <Icon name="search" size={24} color={currentTheme.primary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.eventName}>{eventName}</Text>
        <Text style={styles.statsText}>
          {t('checkInHistory.totalCheckedIn', { count: totalItems })}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={checkInHistory}
        keyExtractor={(item, index) => `${item.checkInLogId}-${index}`}
        renderItem={renderCheckInItem}
        showsVerticalScrollIndicator={false}
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
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={checkInHistory.length === 0 ? styles.emptyContainer : styles.listContainer}
      />

      {/* QR Search Modal */}
      {renderQRSearchModal()}
    </View>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: spacing.md, // giống ChangePasswordScreen
    paddingTop: spacing.md, // nhỏ lại
    paddingBottom: spacing.sm, // nhỏ lại
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs, // nhỏ lại
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  headerTitle: {
    ...typography.h4, // nhỏ hơn
    color: theme.text,
    fontWeight: '600',
  },
  searchButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  modalSearchButton: {
    backgroundColor: theme.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  eventName: {
    ...typography.body2, // nhỏ hơn
    color: theme.text,
    marginBottom: spacing.xs,
  },
  statsText: {
    ...typography.caption, // nhỏ hơn
    color: theme.textSecondary,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
  },
  itemContainer: {
    backgroundColor: theme.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  qrCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qrCodeText: {
    ...typography.body1,
    color: theme.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
    fontSize: 10,
  },
  itemContent: {
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoLabel: {
    ...typography.caption,
    color: theme.textSecondary,
    minWidth: 80,
  },
  infoValue: {
    ...typography.caption,
    color: theme.text,
    flex: 1,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: theme.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: theme.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyMessage: {
    ...typography.body2,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: theme.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body1,
    color: theme.text,
    backgroundColor: theme.background,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchResultContainer: {
    marginTop: spacing.md,
  },
  searchResultTitle: {
    ...typography.h4,
    color: theme.text,
    marginBottom: spacing.sm,
  },
  resultCard: {
    backgroundColor: theme.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultQRCode: {
    ...typography.body1,
    color: theme.text,
    fontWeight: '600',
  },
  resultStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  resultStatusText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
    fontSize: 10,
  },
  resultMessage: {
    ...typography.body2,
    color: theme.textSecondary,
    marginBottom: spacing.sm,
  },
  resultDetails: {
    gap: spacing.xs,
  },
  resultDetailText: {
    ...typography.caption,
    color: theme.text,
  },
});

export default CheckInHistoryScreen; 