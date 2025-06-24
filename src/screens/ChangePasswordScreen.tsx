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
import { useAuthStore } from '../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { useToast } from '../components';

const ChangePasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { showSuccessToast, showErrorToast } = useToast();
  
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

  const validateForm = (): boolean => {
    if (!formData.currentPassword.trim()) {
      showErrorToast(t('changePassword.errors.currentPasswordRequired'));
      return false;
    }
    
    if (!formData.newPassword.trim()) {
      showErrorToast(t('changePassword.errors.newPasswordRequired'));
      return false;
    }
    
    if (formData.newPassword.length < 6) {
      showErrorToast(t('changePassword.errors.passwordTooShort'));
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
    
    try {
      setIsLoading(true);
      
      // TODO: Call API to change password
      // const response = await apiService.changePassword({
      //   currentPassword: formData.currentPassword,
      //   newPassword: formData.newPassword,
      // });

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      showSuccessToast(t('changePassword.messages.changeSuccess'));
    } catch (error) {
      showErrorToast(t('changePassword.errors.changeFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        
        {/* Header Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('changePassword.title')}</Text>
          <Text style={styles.infoText}>{t('changePassword.description')}</Text>
          <Text style={styles.username}>{t('changePassword.forAccount')}: {user?.username}</Text>
        </View>

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
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('current')}
              >
                <Icon
                  name={showPasswords.current ? 'eye-off' : 'eye'}
                  size={20}
                  color="#999"
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
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('new')}
              >
                <Icon
                  name={showPasswords.new ? 'eye-off' : 'eye'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>{t('changePassword.passwordHint')}</Text>
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
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('confirm')}
              >
                <Icon
                  name={showPasswords.confirm ? 'eye-off' : 'eye'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* Security Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>{t('changePassword.securityTips.title')}</Text>
          <Text style={styles.tipText}>• {t('changePassword.securityTips.tip1')}</Text>
          <Text style={styles.tipText}>• {t('changePassword.securityTips.tip2')}</Text>
          <Text style={styles.tipText}>• {t('changePassword.securityTips.tip3')}</Text>
          <Text style={styles.tipText}>• {t('changePassword.securityTips.tip4')}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  tipsSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  changeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  changeButtonDisabled: {
    backgroundColor: '#999',
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen; 