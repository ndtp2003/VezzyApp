import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services/api';
import { handleApiError } from '../utils';
import { useToast } from '../components';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme } from '../theme';

interface RouteParams {
  email: string;
}

const ResetPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = (route.params as RouteParams) || { email: '' };
  const { showSuccessToast, showErrorToast } = useToast();
  const { theme } = useSettingsStore();
  
  const [formData, setFormData] = useState({
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Get current theme
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = (): boolean => {
    if (!formData.verificationCode.trim()) {
      showErrorToast(t('resetPassword.errors.codeRequired'));
      return false;
    }
    
    if (!formData.newPassword.trim()) {
      showErrorToast(t('resetPassword.errors.passwordRequired'));
      return false;
    }
    
    if (!validatePassword(formData.newPassword)) {
      showErrorToast(t('resetPassword.errors.passwordRequirements'));
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      showErrorToast(t('resetPassword.errors.passwordMismatch'));
      return false;
    }
    
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      const response = await apiService.resetPassword({
        email: email,
        verificationCode: formData.verificationCode.trim(),
        newPassword: formData.newPassword,
      });

      if (response.flag) {
        showSuccessToast(t('resetPassword.messages.resetSuccess'), 4000);
        // Navigate to login after short delay
        setTimeout(() => {
          navigation.navigate('Login' as never);
        }, 1000);
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

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiService.forgotPassword({
        email: email,
      });

      if (response.flag) {
        showSuccessToast(t('resetPassword.messages.codeResent'));
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

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
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
          <Text style={styles.title}>{t('resetPassword.title')}</Text>
        </View>

        <View style={styles.content}>
          
          {/* Info Section */}
          <View style={styles.infoSection}>
            <Icon name="shield-checkmark-outline" size={64} color={currentTheme.primary} style={styles.infoIcon} />
            <Text style={styles.infoTitle}>{t('resetPassword.title')}</Text>
            <Text style={styles.infoText}>
              {t('resetPassword.description')} {email}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            
            {/* Verification Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('resetPassword.verificationCode')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('resetPassword.placeholders.verificationCode')}
                placeholderTextColor={currentTheme.textSecondary}
                value={formData.verificationCode}
                onChangeText={(text) => setFormData(prev => ({ ...prev, verificationCode: text }))}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={6}
              />
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('resetPassword.newPassword')} *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('resetPassword.placeholders.newPassword')}
                  placeholderTextColor={currentTheme.textSecondary}
                  value={formData.newPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, newPassword: text }))}
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('new')}
                >
                  <Icon
                    name={showPasswords.new ? 'eye-off' : 'eye'}
                    size={20}
                    color={currentTheme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>{t('resetPassword.passwordHint')}</Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('resetPassword.confirmPassword')} *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('resetPassword.placeholders.confirmPassword')}
                  placeholderTextColor={currentTheme.textSecondary}
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                  secureTextEntry={!showPasswords.confirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('confirm')}
                >
                  <Icon
                    name={showPasswords.confirm ? 'eye-off' : 'eye'}
                    size={20}
                    color={currentTheme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.resetButtonText}>
                {isLoading ? t('common.loading') : t('resetPassword.resetButton')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Resend Code Section */}
          <View style={styles.resendSection}>
            <Text style={styles.resendText}>{t('resetPassword.didNotReceive')}</Text>
            <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
              <Text style={[styles.resendLink, isLoading && styles.resendLinkDisabled]}>
                {t('resetPassword.resendCode')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>{t('resetPassword.help.title')}</Text>
            <Text style={styles.helpText}>• {t('resetPassword.help.tip1')}</Text>
            <Text style={styles.helpText}>• {t('resetPassword.help.tip2')}</Text>
            <Text style={styles.helpText}>• {t('resetPassword.help.tip3')}</Text>
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
  inputGroup: {
    marginBottom: 20,
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
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.card,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
  },
  eyeButton: {
    padding: 12,
  },
  helperText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  resetButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonDisabled: {
    backgroundColor: theme.disabled,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resendText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  resendLink: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: theme.disabled,
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

export default ResetPasswordScreen; 
