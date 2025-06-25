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
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../store/authStore';
import { handleApiError } from '../utils';
import { lightTheme, darkTheme, spacing, borderRadius, typography } from '../theme';
import { useSettingsStore } from '../store/settingsStore';
import { useToast } from '../components';

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { login, isLoading } = useAuthStore();
  const { theme } = useSettingsStore();
  const { showSuccessToast, showErrorToast } = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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
      // No success toast needed - navigation will happen automatically
      // The user can see they're logged in when the screen changes
    } catch (error) {
      // Clear only password on error, keep username
      setPassword('');
      const errorMessage = handleApiError(error, t);
      showErrorToast(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
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
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{t('login.title')}</Text>
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
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('login.password')}
                  placeholderTextColor={currentTheme.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={currentTheme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
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

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                {t('login.forgotPassword')}
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h3,
    color: theme.text,
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
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    ...typography.body1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.xl,
    color: theme.text,
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.xs,
  },
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginButtonDisabled: {
    backgroundColor: theme.disabled,
  },
  loginButtonText: {
    ...typography.button,
    color: theme.background,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  forgotPasswordText: {
    ...typography.body2,
    color: theme.primary,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen; 
