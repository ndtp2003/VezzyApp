import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/settingsStore';
import { useToast } from '../components';
import { lightTheme, darkTheme } from '../theme';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { 
    theme, 
    language, 
    emailNotifications,
    pushNotifications,
    setTheme,
    setLanguage,
    setEmailNotifications,
    setPushNotifications,
    updateUserConfigApi,
    resetToDefaults,
    isLoading
  } = useSettingsStore();
  const { showSuccessToast, showErrorToast } = useToast();
  
  // Ensure i18n language matches settings store language
  useEffect(() => {
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, []);

  // Monitor language changes
  useEffect(() => {
  }, [language]);
  
  // Get current theme
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  const languageOptions = [
    { label: 'English', value: 'en', flag: '🇺🇸' },
    { label: 'Tiếng Việt', value: 'vi', flag: '🇻🇳' },
  ];

  const themeOptions = [
    { label: t('settings.theme.light'), value: 'light', icon: 'sunny' },
    { label: t('settings.theme.dark'), value: 'dark', icon: 'moon' },
    { label: t('settings.theme.system'), value: 'system', icon: 'phone-portrait' },
  ];

  const handleLanguageChange = async (newLanguage: 'en' | 'vi') => {
    if (!user) return;
    
    try {
      // Update i18n first
      await i18n.changeLanguage(newLanguage);
      
      // Update settings store
      setLanguage(newLanguage);
      
      // Update user config
      await updateUserConfigApi(user.accountId, { language: newLanguage });
      
      showSuccessToast(t('settings.messages.themeUpdated'));
    } catch (error) {
      setLanguage(language);
      i18n.changeLanguage(language);
      showErrorToast(t('settings.errors.updateFailed'));
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    if (isLoading || !user) return;
    
    try {
      // Update via API and local store
      await updateUserConfigApi(user.accountId, { theme: newTheme });
      
      showSuccessToast(t('settings.messages.themeUpdated'));
    } catch (error) {
      showErrorToast(t('settings.errors.updateFailed'));
    }
  };

  const handleNotificationToggle = async (type: 'email' | 'push', value: boolean) => {
    if (isLoading || !user) return;
    
    try {
      if (type === 'email') {
        await updateUserConfigApi(user.accountId, { emailNotifications: value });
      } else {
        await updateUserConfigApi(user.accountId, { pushNotifications: value });
      }
    } catch (error) {
      showErrorToast(t('settings.errors.updateFailed'));
    }
  };

  const handleResetSettings = async () => {
    if (isLoading || !user) return;
    
    try {
      resetToDefaults();
      
      // Sync with backend
      await updateUserConfigApi(user.accountId, {
        language: 'en',
        theme: 'light',
        emailNotifications: true,
        pushNotifications: true,
      });
      
      // Update i18n
      i18n.changeLanguage('en');
      
      showSuccessToast(t('settings.messages.resetSuccess'));
    } catch (error) {
      showErrorToast(t('settings.errors.resetFailed'));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language.title')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.language.description')}</Text>
          
          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionItem,
                language === option.value && styles.optionItemSelected,
                isLoading && styles.optionItemDisabled,
              ]}
              onPress={() => handleLanguageChange(option.value as 'en' | 'vi')}
              disabled={isLoading}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.flagIcon}>{option.flag}</Text>
                <Text style={[
                  styles.optionText,
                  language === option.value && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </View>
              {language === option.value && (
                <Icon name="checkmark" size={20} color={currentTheme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.theme.title')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.theme.description')}</Text>
          
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionItem,
                theme === option.value && styles.optionItemSelected,
                isLoading && styles.optionItemDisabled,
              ]}
              onPress={() => handleThemeChange(option.value as 'light' | 'dark' | 'system')}
              disabled={isLoading}
            >
              <View style={styles.optionLeft}>
                <Icon name={option.icon} size={20} color={currentTheme.textSecondary} style={styles.themeIcon} />
                <Text style={[
                  styles.optionText,
                  theme === option.value && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </View>
              {theme === option.value && (
                <Icon name="checkmark" size={20} color={currentTheme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications.title')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.notifications.description')}</Text>
          
          {/* Email Notifications */}
          <View style={styles.switchItem}>
            <View style={styles.switchLeft}>
              <Icon name="mail" size={20} color={currentTheme.textSecondary} style={styles.switchIcon} />
              <View>
                <Text style={styles.switchTitle}>{t('settings.notifications.email.title')}</Text>
                <Text style={styles.switchDescription}>{t('settings.notifications.email.description')}</Text>
              </View>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={(value) => handleNotificationToggle('email', value)}
              trackColor={{ false: currentTheme.disabled, true: currentTheme.primary }}
              thumbColor={emailNotifications ? '#fff' : '#fff'}
              disabled={isLoading}
            />
          </View>

          {/* Push Notifications */}
          <View style={styles.switchItem}>
            <View style={styles.switchLeft}>
              <Icon name="notifications" size={20} color={currentTheme.textSecondary} style={styles.switchIcon} />
              <View>
                <Text style={styles.switchTitle}>{t('settings.notifications.push.title')}</Text>
                <Text style={styles.switchDescription}>{t('settings.notifications.push.description')}</Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={(value) => handleNotificationToggle('push', value)}
              trackColor={{ false: currentTheme.disabled, true: currentTheme.primary }}
              thumbColor={pushNotifications ? '#fff' : '#fff'}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Advanced Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.advanced.title')}</Text>
          
          {/* Reset Settings */}
          <TouchableOpacity 
            style={[styles.dangerItem, isLoading && styles.dangerItemDisabled]} 
            onPress={handleResetSettings}
            disabled={isLoading}
          >
            <Icon name="refresh" size={20} color="#FF3B30" style={styles.dangerIcon} />
            <View>
              <Text style={styles.dangerTitle}>{t('settings.reset.title')}</Text>
              <Text style={styles.dangerDescription}>{t('settings.reset.description')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>{t('settings.appInfo.version')}: 1.0.0</Text>
          <Text style={styles.infoText}>{t('settings.appInfo.buildNumber')}: 1</Text>
        </View>

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugSection}>
            <Text style={styles.debugText}>Debug Info:</Text>
            <Text style={styles.debugText}>Settings Language: {language}</Text>
            <Text style={styles.debugText}>i18n Language: {i18n.language}</Text>
          </View>
        )}

      </View>
    </ScrollView>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.card,
  },
  optionItemSelected: {
    backgroundColor: theme.primary + '20',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  themeIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: theme.text,
  },
  optionTextSelected: {
    color: theme.primary,
    fontWeight: '500',
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    marginRight: 12,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerIcon: {
    marginRight: 12,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
    marginBottom: 2,
  },
  dangerDescription: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  optionItemDisabled: {
    backgroundColor: theme.disabled,
    borderWidth: 1,
    borderColor: theme.border,
    opacity: 0.6,
  },
  dangerItemDisabled: {
    backgroundColor: theme.disabled,
    borderWidth: 1,
    borderColor: theme.border,
    opacity: 0.6,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  infoText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  debugSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
});

export default SettingsScreen; 
