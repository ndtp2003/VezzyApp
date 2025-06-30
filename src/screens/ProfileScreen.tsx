import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useLanguageSync } from '../hooks/useLanguageSync';
import { lightTheme, darkTheme, spacing, borderRadius, typography, shadows } from '../theme';
import { useToast } from '../components';
import ConfirmDialog from '../components/ConfirmDialog';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuthStore();
  const { theme } = useSettingsStore();
  const { showSuccessToast, showErrorToast } = useToast();
  
  // Ref for ScrollView to control scroll position
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State for logout confirmation dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // Sync language with user config
  useLanguageSync();
  
  // Reset scroll position when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset scroll to top when screen is focused
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
      showSuccessToast(t('common.logout'));
    } catch (error) {
      showErrorToast(t('common.error'));
      setShowLogoutDialog(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.notAvailable');
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getGenderText = (gender: number) => {
    switch (gender) {
      case 0: return t('profile.gender.male');
      case 1: return t('profile.gender.female');
      case 2: return t('profile.gender.other');
      case 3: return t('profile.gender.unknown');
      default: return t('common.notAvailable');
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView ref={scrollViewRef} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ 
                uri: user.avatarUrl || 'https://via.placeholder.com/100x100/cccccc/666666?text=User' 
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.userName}>{user.fullName || user.username}</Text>
          <Text style={styles.userRole}>{t('profile.collaborator')}</Text>
        </View>

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.username')}</Text>
            <Text style={styles.infoValue}>{user.username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.email')}</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
            <Text style={styles.infoValue}>{user.phone || t('common.notAvailable')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('editProfile.gender')}</Text>
            <Text style={styles.infoValue}>{getGenderText(user.gender)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.dateOfBirth')}</Text>
            <Text style={styles.infoValue}>{formatDate(user.dob)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.location')}</Text>
            <Text style={styles.infoValue}>{user.location || t('common.notAvailable')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.joinedDate')}</Text>
            <Text style={styles.infoValue}>{formatDate(user.accountCreatedAt)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Icon name="edit" size={24} color={currentTheme.primary} />
            <Text style={styles.actionButtonText}>{t('profile.actions.editProfile')}</Text>
            <Icon name="chevron-right" size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
            <Icon name="lock" size={24} color={currentTheme.primary} />
            <Text style={styles.actionButtonText}>{t('profile.actions.changePassword')}</Text>
            <Icon name="chevron-right" size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
            <Icon name="settings" size={24} color={currentTheme.primary} />
            <Text style={styles.actionButtonText}>{t('profile.actions.settings')}</Text>
            <Icon name="chevron-right" size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Icon name="logout" size={24} color={currentTheme.error} />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>{t('common.logout')}</Text>
            <Icon name="chevron-right" size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title={t('profile.logoutTitle')}
        message={t('profile.logoutMessage')}
        confirmText={t('common.logout')}
        cancelText={t('common.cancel')}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
        type="danger"
        icon="logout"
      />
    </>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    ...typography.body1,
    color: theme.textSecondary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.card,
  },
  userName: {
    ...typography.h3,
    color: theme.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  userRole: {
    ...typography.body2,
    color: theme.primary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoSection: {
    padding: spacing.lg,
    backgroundColor: theme.surface,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h5,
    color: theme.text,
    marginBottom: spacing.lg,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  infoLabel: {
    ...typography.body2,
    color: theme.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...typography.body1,
    color: theme.text,
    flex: 2,
    textAlign: 'right',
  },
  actionsSection: {
    padding: spacing.lg,
    backgroundColor: theme.surface,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  actionButtonText: {
    ...typography.body1,
    color: theme.text,
    flex: 1,
    marginLeft: spacing.md,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: theme.error,
  },
});

export default ProfileScreen; 
