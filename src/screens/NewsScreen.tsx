import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNewsStore } from '../store/newsStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { News, NewsStatus, NewsStackParamList, MainTabParamList } from '../types';
import { lightTheme, darkTheme } from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from 'react-native-vector-icons/Ionicons';

type NewsScreenNavigationProp = StackNavigationProp<NewsStackParamList, 'NewsList'>;

const NewsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NewsScreenNavigationProp>();
  const { theme } = useSettingsStore();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? darkTheme : lightTheme;
  const { user } = useAuthStore();
  
  const {
    newsList,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasNextPage,
    error,
    loadNews,
    loadMoreNews,
    refreshNews,
    clearError,
  } = useNewsStore();

  const themedStyles = useMemo(() => getThemedStyles(isDarkMode, colors), [isDarkMode, colors]);

  // Load initial data
  useEffect(() => {
    loadNews();
  }, []);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    refreshNews();
  }, [refreshNews]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isLoadingMore) {
      loadMoreNews();
    }
  }, [hasNextPage, isLoadingMore, loadMoreNews]);

  // Handle news item press
  const handleNewsPress = useCallback((news: News) => {
    navigation.navigate('NewsDetail', { newsId: news.newsId });
  }, [navigation]);

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

  // Render news item
  const renderNewsItem = useCallback(({ item }: { item: News }) => (
    <View style={[styles.newsItemContainer, themedStyles.newsItemContainer]}>
      <TouchableOpacity
        style={[styles.newsItem, themedStyles.newsItem]}
        onPress={() => handleNewsPress(item)}
        activeOpacity={0.7}
      >
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.newsImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.newsContent}>
          <View style={styles.newsHeader}>
            <Text style={[styles.newsTitle, themedStyles.newsTitle]} numberOfLines={2}>
              {item.newsTitle}
            </Text>
            {/* Only show status badge for known statuses (not unknown) */}
            {item.status >= 0 && item.status <= 2 && (
              <View style={[styles.statusBadge, getStatusBadgeStyle(item.status, colors)]}>
                <Text style={styles.statusText}>
                  {getStatusText(item.status, t)}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.newsDescription, themedStyles.newsDescription]} numberOfLines={3}>
            {item.newsDescription}
          </Text>
          <View style={styles.newsFooter}>
            <Text style={[styles.newsDate, themedStyles.newsDate]}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
            {item.eventId && (
              <View style={styles.eventTagContainer}>
                <Icon name="event" size={14} color={colors.primary} />
                <Text style={[styles.eventTag, themedStyles.eventTag]}>
                  {t('news.eventRelated')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  ), [themedStyles, handleNewsPress, t, colors]);

  // Render list footer
  const renderListFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, themedStyles.loadingText]}>
          {t('common.loadingMore')}
        </Text>
      </View>
    );
  }, [isLoadingMore, themedStyles, t, colors]);

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, themedStyles.emptyTitle]}>
        {t('news.empty.title')}
      </Text>
      <Text style={[styles.emptyMessage, themedStyles.emptyMessage]}>
        {t('news.empty.message')}
      </Text>
    </View>
  ), [themedStyles, t]);

  if (isLoading && newsList.length === 0) {
    return <LoadingSpinner visible={true} message={t('news.loading')} />;
  }

  return (
    <View style={[styles.container, themedStyles.container]}>
      <View style={[styles.header, themedStyles.header]}>
        <Text style={[styles.headerTitle, themedStyles.headerTitle]}>
          {t('news.title')}
        </Text>
        <Text style={[styles.headerSubtitle, themedStyles.headerSubtitle]}>
          {t('news.subtitle')}
        </Text>
      </View>

      <FlatList
        data={newsList}
        keyExtractor={(item, index) => `news-${item.newsId}-${index}`}
        renderItem={renderNewsItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={newsList.length === 0 ? styles.emptyContainer : undefined}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </View>
  );
};

// Helper functions
const getStatusText = (status: NewsStatus, t: any): string => {
  switch (status) {
    case NewsStatus.Approved:
      return t('news.status.approved');
    case NewsStatus.Pending:
      return t('news.status.pending');
    case NewsStatus.Rejected:
      return t('news.status.rejected');
    default:
      return t('news.status.unknown');
  }
};

const getStatusBadgeStyle = (status: NewsStatus, colors: any) => {
  switch (status) {
    case NewsStatus.Approved:
      return { backgroundColor: colors.success };
    case NewsStatus.Pending:
      return { backgroundColor: '#FF9500' }; // Orange for pending
    case NewsStatus.Rejected:
      return { backgroundColor: colors.error };
    default:
      return { backgroundColor: colors.disabled };
  }
};

const getThemedStyles = (isDarkMode: boolean, colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
  },
  headerSubtitle: {
    color: colors.textSecondary,
  },
  newsItemContainer: {
    backgroundColor: 'transparent',
  },
  newsItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  newsImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  newsContent: {
    padding: 16,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  newsTitle: {
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  newsDescription: {
    color: colors.textSecondary,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  newsDate: {
    color: colors.textSecondary,
  },
  eventTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTag: {
    color: colors.primary,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
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
    color: colors.text,
  },
  emptyMessage: {
    color: colors.textSecondary,
  },
});

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
  newsItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newsItem: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 4,
  },
  newsImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  newsContent: {
    padding: 16,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  newsDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  newsDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  eventTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTag: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NewsScreen; 
