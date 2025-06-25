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

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { showSuccessToast, showErrorToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('forgotPassword.title')}</Text>
        </View>

        <View style={styles.content}>
          
          {/* Info Section */}
          <View style={styles.infoSection}>
            <Icon name="mail-outline" size={64} color="#007AFF" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>{t('forgotPassword.title')}</Text>
            <Text style={styles.infoText}>{t('forgotPassword.description')}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.label}>{t('forgotPassword.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('forgotPassword.emailPlaceholder')}
              placeholderTextColor="#999"
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

          {/* Back to Login */}
          <TouchableOpacity style={styles.backToLoginContainer} onPress={handleGoBack}>
            <Text style={styles.backToLoginText}>
              {t('forgotPassword.backToLogin')}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
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
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#999',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  backToLoginContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen; 
