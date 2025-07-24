import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HTMLView from 'react-native-htmlview';
import { useSettingsStore } from '../store/settingsStore';
import { useEventStore } from '../store/eventStore';
import { lightTheme, darkTheme, spacing, borderRadius, typography } from '../theme';

const EventDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useSettingsStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  // Lấy eventId từ params
  const { eventId } = (route.params as any) || {};
  const { events } = useEventStore();
  const event = events.find(e => e.eventId === eventId);

  // Log dữ liệu truyền sang để kiểm tra
  //console.log('[EventDetailScreen] eventId:', eventId, 'event:', event);

  // Hàm chuyển **text** thành <strong>text</strong>
  const convertMarkdownBoldToHtml = (html: string) => {
    return html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  // Style cho HTMLView
  const htmlStyles = StyleSheet.create({
    p: {
      ...typography.body1,
      color: currentTheme.text,
      marginBottom: 4,
      lineHeight: 24,
    },
    strong: {
      color: currentTheme.text,
      fontWeight: 'bold',
    },
  });

  if (!event) {
    return (
      <View style={styles.container}>
        <Icon name="error-outline" size={64} color={currentTheme.error} />
        <Text style={styles.placeholder}>{t('events.detailError')}</Text>
      </View>
    );
  }

  const processedContent = convertMarkdownBoldToHtml(event.eventDescription || '');

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContent}>
        {/* Ảnh cover */}
        {'eventCoverImageUrl' in event && typeof event.eventCoverImageUrl === 'string' && event.eventCoverImageUrl && (
          <Image
            source={{ uri: event.eventCoverImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        {/* Tên sự kiện */}
        <Text style={styles.title}>{event.eventName}</Text>

        {/* Thời gian */}
        <View style={styles.metaRow}>
          <Icon name="schedule" size={18} color={currentTheme.primary} />
          <Text style={styles.metaLabel}>{t('events.details.startTime')}:</Text>
          <Text style={styles.metaValue}>{formatDate(event.startAt)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="schedule" size={18} color={currentTheme.textSecondary} />
          <Text style={styles.metaLabel}>{t('events.details.endTime')}:</Text>
          <Text style={styles.metaValue}>{formatDate(event.endAt)}</Text>
        </View>

        {/* Địa điểm */}
        {'eventLocation' in event && typeof event.eventLocation === 'string' && event.eventLocation && (
          <View style={styles.metaRowLocation}>
            <Icon name="location-on" size={18} color={currentTheme.primary} />
            <Text style={styles.metaLabel}>{t('events.details.location')}:</Text>
            <View style={styles.metaValueLocationWrapper}>
              <Text style={styles.metaValueLocation}>{event.eventLocation}</Text>
            </View>
          </View>
        )}

        {/* Tags */}
        {'tags' in event && Array.isArray(event.tags) && event.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {event.tags.map(tag => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Mô tả HTML/Markdown */}
        <HTMLView value={processedContent} stylesheet={htmlStyles} />

        {/* Nội dung chi tiết */}
        {'contents' in event && Array.isArray(event.contents) && event.contents.length > 0 && (
          <View style={styles.contentsSection}>
            <Text style={styles.sectionTitle}>{t('events.details.contents')}</Text>
            {event.contents.map((item, idx) => (
              <Text key={idx} style={styles.contentDescription}>{item.description}</Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  innerContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, color: theme.text, marginBottom: spacing.md },
  placeholder: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: spacing.lg },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaLabel: {
    ...typography.body2,
    color: theme.textSecondary,
    marginLeft: 6,
    marginRight: 4,
  },
  metaValue: {
    ...typography.body2,
    color: theme.text,
  },
  metaRowLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  metaValueLocationWrapper: {
    flex: 1,
    paddingRight: spacing.md,
  },
  metaValueLocation: {
    ...typography.body2,
    color: theme.text,
    textAlign: 'left',
    minWidth: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: 6,
  },
  tagBadge: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: theme.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  contentsSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h5,
    color: theme.text,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  contentDescription: {
    color: theme.text,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  contentImage: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.sm,
    marginTop: 4,
  },
});

export default EventDetailScreen; 
