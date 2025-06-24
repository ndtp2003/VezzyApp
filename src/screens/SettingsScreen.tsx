import React, { useState } from 'react';
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
import { useLanguageSync } from '../hooks/useLanguageSync';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/settingsStore';
import { useToast } from '../components';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userConfig, updateUserConfig } = useAuthStore();
  const { 
    theme, 
    language, 
    emailNotifications, 
    pushNotifications,
    updateTheme,
    updateLanguage,
    updateEmailNotifications,
    updatePushNotifications,
    resetSettings
  } = useSettingsStore();
  const { showSuccessToast, showErrorToast } = useToast();
  
  // Sync language with user config
  useLanguageSync();
  
  const [localSettings, setLocalSettings] = useState({
    language: userConfig?.language || 'en',
    theme: userConfig?.theme || 'light',
    receiveEmail: userConfig?.receiveEmail || false,
    receiveNotify: userConfig?.receiveNotify || false,
  });
  
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      setLocalSettings(prev => ({ ...prev, language: newLanguage }));
      await updateLanguage(newLanguage);
      i18n.changeLanguage(newLanguage);
      setShowLanguageModal(false);
      showSuccessToast(t('settings.messages.themeUpdated'));
    } catch (error) {
      showErrorToast(t('settings.errors.updateFailed'));
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      setLocalSettings(prev => ({ ...prev, theme: newTheme }));
      await updateTheme(newTheme);
      showSuccessToast(t('settings.messages.themeUpdated'));
    } catch (error) {
      showErrorToast(t('settings.errors.updateFailed'));
    }
  };

  const handleEmailNotificationChange = async (value: boolean) => {
    try {
      setLocalSettings(prev => ({ ...prev, receiveEmail: value }));
      await updateEmailNotifications(value);
      if (userConfig) {
        updateUserConfig({ receiveEmail: value });
      }
    } catch (error) {
      showErrorToast(t('settings.errors.updateFailed'));
    }
  };

  const handleNotificationToggle = async (type: 'receiveEmail' | 'receiveNotify', value: boolean) => {
    try {
      setLocalSettings(prev => ({ ...prev, [type]: value }));
      
      // TODO: Call API to update user config
      // await apiService.updateUserConfig({ [type]: value });
      
      // Update local store
      updateUserConfig({ [type]: value });
      
    } catch (error) {
      showErrorToast(t('settings.errors.updateFailed'));
      // Revert on error
      setLocalSettings(prev => ({ ...prev, [type]: !value }));
    }
  };

  const handleResetSettings = () => {
    // For now, we'll use a simple confirmation with error toast
    // TODO: Create a custom confirmation dialog component later
    try {
      const defaultSettings = {
        language: 'en' as const,
        theme: 'light' as const,
        receiveEmail: false,
        receiveNotify: true,
      };
      
      setLocalSettings(defaultSettings);
      i18n.changeLanguage(defaultSettings.language);
      updateUserConfig(defaultSettings);
      
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
                localSettings.language === option.value && styles.optionItemSelected,
              ]}
              onPress={() => handleLanguageChange(option.value as 'en' | 'vi')}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.flagIcon}>{option.flag}</Text>
                <Text style={[
                  styles.optionText,
                  localSettings.language === option.value && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </View>
              {localSettings.language === option.value && (
                <Icon name="checkmark" size={20} color="#007AFF" />
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
                localSettings.theme === option.value && styles.optionItemSelected,
              ]}
              onPress={() => handleThemeChange(option.value as 'light' | 'dark' | 'system')}
            >
              <View style={styles.optionLeft}>
                <Icon name={option.icon} size={20} color="#666" style={styles.themeIcon} />
                <Text style={[
                  styles.optionText,
                  localSettings.theme === option.value && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </View>
              {localSettings.theme === option.value && (
                <Icon name="checkmark" size={20} color="#007AFF" />
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
              <Icon name="mail" size={20} color="#666" style={styles.switchIcon} />
              <View>
                <Text style={styles.switchTitle}>{t('settings.notifications.email.title')}</Text>
                <Text style={styles.switchDescription}>{t('settings.notifications.email.description')}</Text>
              </View>
            </View>
            <Switch
              value={localSettings.receiveEmail}
              onValueChange={(value) => handleNotificationToggle('receiveEmail', value)}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
              thumbColor={localSettings.receiveEmail ? '#fff' : '#fff'}
            />
          </View>

          {/* Push Notifications */}
          <View style={styles.switchItem}>
            <View style={styles.switchLeft}>
              <Icon name="notifications" size={20} color="#666" style={styles.switchIcon} />
              <View>
                <Text style={styles.switchTitle}>{t('settings.notifications.push.title')}</Text>
                <Text style={styles.switchDescription}>{t('settings.notifications.push.description')}</Text>
              </View>
            </View>
            <Switch
              value={localSettings.receiveNotify}
              onValueChange={(value) => handleNotificationToggle('receiveNotify', value)}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
              thumbColor={localSettings.receiveNotify ? '#fff' : '#fff'}
            />
          </View>
        </View>

        {/* Advanced Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.advanced.title')}</Text>
          
          {/* Reset Settings */}
          <TouchableOpacity style={styles.dangerItem} onPress={handleResetSettings}>
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

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#f8f9fa',
  },
  optionItemSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#007AFF',
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
    color: '#333',
  },
  optionTextSelected: {
    color: '#007AFF',
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
    color: '#333',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
});

export default SettingsScreen; 