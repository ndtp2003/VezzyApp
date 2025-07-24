import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useLoadingStore } from '../store/loadingStore';
import { apiService } from '../services/api';
import Icon from 'react-native-vector-icons/Ionicons';
import { useToast } from '../components';
import { lightTheme, darkTheme, spacing, borderRadius, typography } from '../theme';
import { validatePassword } from '../utils/validation';

interface PasswordRequirement {
  key: string;
  label: string;
  regex: RegExp;
  met: boolean;
}

const ChangePasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { theme } = useSettingsStore();
  const { showSuccessToast, showErrorToast } = useToast();
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Password requirements validation
  const getPasswordRequirements = (password: string): PasswordRequirement[] => {
    return [
      {
        key: 'length',
        label: t('changePassword.requirements.length'),
        regex: /.{8,}/,
        met: password.length >= 8,
      },
      {
        key: 'uppercase',
        label: t('changePassword.requirements.uppercase'),
        regex: /[A-Z]/,
        met: /[A-Z]/.test(password),
      },
      {
        key: 'lowercase',
        label: t('changePassword.requirements.lowercase'),
        regex: /[a-z]/,
        met: /[a-z]/.test(password),
      },
      {
        key: 'number',
        label: t('changePassword.requirements.number'),
        regex: /[0-9]/,
        met: /[0-9]/.test(password),
      },
      {
        key: 'special',
        label: t('changePassword.requirements.special'),
        regex: /[!@#$%^&*(),.?":{}|<>]/,
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    ];
  };

  const isPasswordStrong = (password: string): boolean => {
    const requirements = getPasswordRequirements(password);
    return requirements.every(req => req.met);
  };

  const validateForm = (): boolean => {
    if (!formData.currentPassword.trim()) {
      showErrorToast(t('changePassword.errors.currentPasswordRequired'));
      return false;
    }
    
    // Use backend-compatible password validation
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      showErrorToast(passwordValidation.errorMessage || t('changePassword.errors.passwordRequirements'));
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      showErrorToast(t('changePassword.errors.passwordMismatch'));
      return false;
    }
    
    if (formData.currentPassword === formData.newPassword) {
      showErrorToast(t('changePassword.errors.samePassword'));
      return false;
    }
    
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;
    
    const { showLoading, hideLoading } = useLoadingStore.getState();
    
    try {
      setIsLoading(true);
      showLoading(t('common.changingPassword'));
      
      const response = await apiService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.flag) {
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        showSuccessToast(t('changePassword.messages.changeSuccess'));
        
        // Navigate back to profile after successful change
        setTimeout(() => {
          navigation.goBack();
        }, 1000); // Small delay to let user see success message
      } else {
        throw new Error(response.message || 'Change password failed');
      }
    } catch (error: any) {
      // Handle specific backend errors
      let errorMessage = t('changePassword.errors.changeFailed');
      
      if (error?.response?.status === 400) {
        errorMessage = t('changePassword.errors.currentPasswordIncorrect');
      } else if (error?.response?.status === 404) {
        errorMessage = t('changePassword.errors.accountNotFound');
      } else if (error?.response?.status === 500) {
        errorMessage = t('changePassword.errors.serverError');
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showErrorToast(errorMessage);
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const passwordRequirements = getPasswordRequirements(formData.newPassword);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>

        {/* Form Fields */}
        <View style={styles.formSection}>
          
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('changePassword.currentPassword')} *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.currentPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, currentPassword: text }))}
                placeholder={t('changePassword.placeholders.currentPassword')}
                secureTextEntry={!showPasswords.current}
                placeholderTextColor={currentTheme.placeholder}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('current')}
              >
                <Icon
                  name={showPasswords.current ? 'eye-off' : 'eye'}
                  size={20}
                  color={currentTheme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('changePassword.newPassword')} *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.newPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, newPassword: text }))}
                placeholder={t('changePassword.placeholders.newPassword')}
                secureTextEntry={!showPasswords.new}
                placeholderTextColor={currentTheme.placeholder}
                autoCapitalize="none"
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
            
            {/* Password Requirements */}
            {formData.newPassword.length > 0 && (
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>{t('changePassword.requirements.title')}</Text>
                {passwordRequirements.map((requirement) => (
                  <View key={requirement.key} style={styles.requirementRow}>
                    <Icon
                      name={requirement.met ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={requirement.met ? '#4CAF50' : '#F44336'}
                    />
                    <Text style={[
                      styles.requirementText,
                      { color: requirement.met ? '#4CAF50' : '#F44336' }
                    ]}>
                      {requirement.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('changePassword.confirmPassword')} *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                placeholder={t('changePassword.placeholders.confirmPassword')}
                secureTextEntry={!showPasswords.confirm}
                placeholderTextColor={currentTheme.placeholder}
                autoCapitalize="none"
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
            
            {/* Password Match Indicator */}
            {formData.confirmPassword.length > 0 && (
              <View style={styles.matchIndicator}>
                <Icon
                  name={formData.newPassword === formData.confirmPassword ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={formData.newPassword === formData.confirmPassword ? '#4CAF50' : '#F44336'}
                />
                <Text style={[
                  styles.matchText,
                  { color: formData.newPassword === formData.confirmPassword ? '#4CAF50' : '#F44336' }
                ]}>
                  {formData.newPassword === formData.confirmPassword 
                    ? t('changePassword.passwordsMatch') 
                    : t('changePassword.passwordsDontMatch')}
                </Text>
              </View>
            )}
          </View>

        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[styles.changeButton, isLoading && styles.changeButtonDisabled]}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          <Text style={styles.changeButtonText}>
            {isLoading ? t('common.saving') : t('changePassword.changeButton')}
          </Text>
        </TouchableOpacity>

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
    padding: spacing.md,
  },
  formSection: {
    backgroundColor: theme.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body2,
    fontWeight: '500',
    color: theme.text,
    marginBottom: spacing.sm,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.md,
    backgroundColor: theme.surface,
  },
  passwordInput: {
    ...typography.body1,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: theme.text,
  },
  eyeButton: {
    padding: spacing.md,
  },
  requirementsContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
  },
  requirementsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requirementText: {
    ...typography.caption,
    marginLeft: spacing.sm,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  matchText: {
    ...typography.caption,
    marginLeft: spacing.sm,
  },
  changeButton: {
    backgroundColor: theme.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  changeButtonDisabled: {
    backgroundColor: theme.disabled,
  },
  changeButtonText: {
    ...typography.button,
    color: theme.background,
  },
});

export default ChangePasswordScreen; 
