import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme, spacing, typography } from '../theme';

interface SplashScreenProps {
  onFinish: () => void;
  canFinish?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, canFinish = false }) => {
  const { t } = useTranslation();
  const { theme } = useSettingsStore();
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Start entrance animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Minimum splash duration of 2.5 seconds for good UX
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [slideAnim]);

  // Effect to handle finishing when both conditions are met
  useEffect(() => {
    if (timeoutReached && canFinish) {
      // Exit animation - slide up and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 2, // Slide up more
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start(() => {
        onFinish();
      });
    }
  }, [timeoutReached, canFinish, onFinish, slideAnim, fadeAnim]);

  // Interpolate animations
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [50, 0, -100], // Start 50px down, move to 0, then slide 100px up
  });

  const opacity = fadeAnim;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <StatusBar 
        backgroundColor={currentTheme.primary} 
        barStyle={theme === 'dark' ? 'light-content' : 'light-content'} 
      />
      
      {/* Logo Section */}
      <Animated.View 
        style={[
          styles.logoSection,
          {
            transform: [{ 
              scale: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }],
          }
        ]}
      >
        {/* You can replace this with an actual logo image */}
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <Text style={styles.appName}>CollaboratorApp</Text>
        <Text style={styles.tagline}>{t('splash.tagline')}</Text>
      </Animated.View>

      {/* Loading Section */}
      <Animated.View 
        style={[
          styles.loadingSection,
          {
            opacity: slideAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.5, 1],
            }),
          }
        ]}
      >
        <ActivityIndicator 
          size="large" 
          color={currentTheme.surface} 
          style={styles.spinner}
        />
        <Text style={styles.loadingText}>
          {t('splash.loading')}
        </Text>
      </Animated.View>

      {/* Footer */}
      <Animated.View 
        style={[
          styles.footer,
          {
            opacity: slideAnim.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0, 0, 1],
            }),
          }
        ]}
      >
        <Text style={styles.footerText}>
          {t('splash.welcome')}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  logoSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  logoText: {
    ...typography.h1,
    color: theme.primary,
    fontWeight: 'bold',
    fontSize: 48,
  },
  appName: {
    ...typography.h2,
    color: theme.surface,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    ...typography.body1,
    color: theme.surface,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: spacing.lg,
  },
  loadingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.body2,
    color: theme.surface,
    textAlign: 'center',
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: theme.surface,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default SplashScreen; 