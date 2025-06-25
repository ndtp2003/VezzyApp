import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services/api';
import { handleApiError } from '../utils';
import { useToast } from '../components';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme } from '../theme';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { showSuccessToast, showErrorToast } = useToast();
  const { theme } = useSettingsStore();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get current theme
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendReset = async () => {
    if (!email.trim()) {
      showErrorToast(t('forgotPassword.errors.emailRequired'));
      return;
    }

    if (!validateEmail(email.trim())) {
      showErrorToast(t('forgotPassword.errors.invalidEmail'));
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiService.forgotPassword({
        email: email.trim(),
      });

      if (response.flag) {
        showSuccessToast(t('forgotPassword.messages.emailSent'));
        navigation.navigate('ResetPassword', { email: email.trim() });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = handleApiError(error, t);
      showErrorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <>
      <StatusBar 
        backgroundColor={currentTheme.background} 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
      />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-back" size={24} color={currentTheme.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('forgotPassword.title')}</Text>
        </View>

        <View style={styles.content}>
          
          {/* Info Section */}
          <View style={styles.infoSection}>
            <Icon name="mail-outline" size={64} color={currentTheme.primary} style={styles.infoIcon} />
            <Text style={styles.infoTitle}>{t('forgotPassword.title')}</Text>
            <Text style={styles.infoText}>{t('forgotPassword.description')}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.label}>{t('forgotPassword.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('forgotPassword.emailPlaceholder')}
              placeholderTextColor={currentTheme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSendReset}
            />

            <TouchableOpacity
              style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
              onPress={handleSendReset}
              disabled={isLoading}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? t('common.loading') : t('forgotPassword.sendButton')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>{t('forgotPassword.help.title')}</Text>
            <Text style={styles.helpText}>• {t('forgotPassword.help.tip1')}</Text>
            <Text style={styles.helpText}>• {t('forgotPassword.help.tip2')}</Text>
            <Text style={styles.helpText}>• {t('forgotPassword.help.tip3')}</Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  infoIcon: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formSection: {
    backgroundColor: theme.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.card,
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.disabled,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default ForgotPasswordScreen; 
