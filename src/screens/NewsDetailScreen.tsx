import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { News, NewsStackParamList, NewsStatus } from '../types';
import { useNewsStore } from '../store/newsStore';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme, spacing, borderRadius, typography, shadows } from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';

type NewsDetailScreenNavigationProp = StackNavigationProp<NewsStackParamList, 'NewsDetail'>;
type NewsDetailScreenRouteProp = RouteProp<NewsStackParamList, 'NewsDetail'>;

const NewsDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NewsDetailScreenNavigationProp>();
  const route = useRoute<NewsDetailScreenRouteProp>();
  const { newsId } = route.params;
  
  const { theme } = useSettingsStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);
  
  const [news, setNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get news from store first
  const { newsList, selectedNews, loadNewsDetail } = useNewsStore();

  useEffect(() => {
    // Always fetch from API to get complete news with authorName
    const fetchNewsDetail = async () => {
      try {
        setIsLoading(true);
        await loadNewsDetail(newsId);
      } catch (error) {
        setError(t('news.empty.message'));
        setIsLoading(false);
      }
    };
    fetchNewsDetail();
  }, [newsId, loadNewsDetail, t]);

  // Listen for selectedNews changes from store
  useEffect(() => {
    if (selectedNews && selectedNews.newsId === newsId) {
      setNews(selectedNews);
      setIsLoading(false);
      setError(null);
    }
  }, [selectedNews, newsId]);

  const handleShare = async () => {
    if (!news) return;
    
    try {
      await Share.share({
        message: `${news.newsTitle}\n\n${news.newsDescription}`,
        title: news.newsTitle,
      });
    } catch (error) {
      console.error('Error sharing news:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: NewsStatus): string => {
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

  const getStatusColor = (status: NewsStatus) => {
    switch (status) {
      case NewsStatus.Approved:
        return currentTheme.success;
      case NewsStatus.Pending:
        return '#FF9500'; // Orange
      case NewsStatus.Rejected:
        return currentTheme.error;
      default:
        return currentTheme.disabled;
    }
  };

    const getAuthorName = (authorId: string, authorName?: string): string => {
    // Use authorName from API if available, otherwise fallback to authorId
    if (authorName && authorName.trim()) {
      return authorName;
    }
    
    // Fallback for older data without authorName
    const authorNames: { [key: string]: string } = {
      'author1': 'Nguyễn Văn A',
      'author2': 'Trần Thị B',
      'author3': 'Lê Văn C',
      'admin': 'Quản trị viên',
      'system': 'Hệ thống',
    };
    
    return authorNames[authorId] || `Tác giả #${authorId.slice(0, 8)}`;
  };

  if (isLoading) {
    return <LoadingSpinner visible={true} message={t('common.loading')} />;
  }

  if (error || !news) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color={currentTheme.error} />
        <Text style={styles.errorTitle}>
          {t('common.error')}
        </Text>
        <Text style={styles.errorMessage}>
          {error || t('news.empty.message')}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Image */}
      {news.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: news.imageUrl }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Icon name="share" size={24} color={currentTheme.surface} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title}>{news.newsTitle}</Text>

        {/* Author and Meta Info */}
        <View style={styles.metaContainer}>
          <View style={styles.authorContainer}>
            <Icon name="person" size={16} color={currentTheme.primary} />
            <Text style={styles.authorText}>
              {t('news.details.author')}: {getAuthorName(news.authorId, news.authorName)}
            </Text>
          </View>
          <Text style={styles.metaText}>
            {t('news.details.publishedAt')}: {formatDate(news.createdAt)}
          </Text>
          {news.updatedAt !== news.createdAt && (
            <Text style={styles.metaText}>
              {t('news.details.updatedAt')}: {formatDate(news.updatedAt)}
            </Text>
          )}
          
          {/* Status Badge and Event Tag - only for valid statuses */}
          {(news.status >= 0 && news.status <= 2) || news.eventId ? (
            <View style={styles.statusContainer}>
              {news.status >= 0 && news.status <= 2 && (
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(news.status) }]}>
                  <Text style={styles.statusText}>
                    {getStatusText(news.status)}
                  </Text>
                </View>
              )}
              {news.eventId && (
                <Text style={styles.eventTag}>
                  {t('news.eventRelated')}
                </Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Description */}
        <Text style={styles.description}>{news.newsDescription}</Text>

        {/* Content */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>{t('news.details.title')}</Text>
          <Text style={styles.content}>{news.newsContent}</Text>
        </View>

        {/* Share Section */}
        <View style={styles.shareContainer}>
          <TouchableOpacity
            style={styles.shareAction}
            onPress={handleShare}
          >
            <Icon name="share" size={24} color={currentTheme.primary} />
            <Text style={styles.shareText}>Chia sẻ tin tức</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    ...typography.h4,
    color: theme.error,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body1,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    ...typography.button,
    color: theme.surface,
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: spacing.lg,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    color: theme.surface,
    fontWeight: '600',
  },
  eventTag: {
    ...typography.caption,
    color: theme.primary,
    fontWeight: '500',
  },
  title: {
    ...typography.h3,
    color: theme.text,
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  metaContainer: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorText: {
    ...typography.body2,
    color: theme.text,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  metaText: {
    ...typography.caption,
    color: theme.textSecondary,
    marginBottom: spacing.xs,
  },
  statusTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  description: {
    ...typography.body1,
    color: theme.text,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  contentSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h5,
    color: theme.text,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  content: {
    ...typography.body1,
    color: theme.text,
    lineHeight: 26,
  },
  shareContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  shareAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.primary,
    ...shadows.sm,
  },
  shareText: {
    ...typography.button,
    color: theme.primary,
    marginLeft: spacing.sm,
  },
});

export default NewsDetailScreen; 
