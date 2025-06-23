import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Switch,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { handleApiError, showErrorToast, showSuccessToast } from '../utils';
import { lightTheme, darkTheme, spacing, borderRadius, typography } from '../theme';
import { useSettingsStore } from '../store/settingsStore';

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { login, isLoading } = useAuthStore();
  const { theme } = useSettingsStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showErrorToast(t('errors.INVALID_CREDENTIALS'));
      return;
    }

    try {
      await login({
        username: username.trim(),
        password,
      });
      showSuccessToast(t('common.success'));
    } catch (error) {
      const errorMessage = handleApiError(error, t);
      showErrorToast(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: 'https://oqijlbtsoeobnditrqxf.supabase.co/storage/v1/object/public/avatars//125fb4b5-f608-45b4-a946-226efb368598_638845435117825139.jpg'
              }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Vezzy</Text>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.enterCredentials')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('login.username')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login.username')}
                placeholderTextColor={currentTheme.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('login.password')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login.password')}
                placeholderTextColor={currentTheme.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <View style={styles.rememberMeContainer}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ 
                  false: currentTheme.disabled, 
                  true: currentTheme.primary 
                }}
                thumbColor={rememberMe ? currentTheme.background : currentTheme.textSecondary}
              />
              <Text style={styles.rememberMeText}>{t('login.rememberMe')}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? t('common.loading') : t('login.loginButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.h2,
    color: theme.primary,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h3,
    color: theme.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body2,
    color: theme.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    ...typography.body1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: theme.text,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  rememberMeText: {
    ...typography.body2,
    color: theme.text,
    marginLeft: spacing.sm,
  },
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: theme.disabled,
  },
  loginButtonText: {
    ...typography.button,
    color: theme.background,
  },
});

export default LoginScreen; 