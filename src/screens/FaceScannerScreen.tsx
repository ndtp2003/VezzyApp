import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Easing,
  Dimensions,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '../types';
import { lightTheme, darkTheme } from '../theme/colors';
import { spacing, borderRadius } from '../theme';
import { requestCameraPermission } from '../utils/permissions';
import { apiService } from '../services/api';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { CheckInResultModal } from '../components';
import CustomToast from '../components/CustomToast';

type FaceScannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FaceScanner'>;
type FaceScannerScreenRouteProp = RouteProp<RootStackParamList, 'FaceScanner'>;

interface FaceScannerScreenProps {}

const FaceScannerScreen: React.FC<FaceScannerScreenProps> = () => {
  const navigation = useNavigation<FaceScannerScreenNavigationProp>();
  const route = useRoute<FaceScannerScreenRouteProp>();
  const { mode = 'update', eventId } = (route.params as any) || {};
  const { t } = useTranslation();
  const { theme } = useSettingsStore();
  const { setLoading, updateUser, updateUserConfig } = useAuthStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [showCheckInResultModal, setShowCheckInResultModal] = useState(false);
  const [checkInResults, setCheckInResults] = useState<any>(null);
  const [hasStartedCountdown, setHasStartedCountdown] = useState(false); // NEW
  
  // Custom Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const cameraRef = useRef<any>(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const instructionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to show custom toast
  const showCustomToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const hideCustomToast = () => {
    setShowToast(false);
  };

  useEffect(() => {
    getCameraPermission();
    startPulseAnimation();
    
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (instructionTimeoutRef.current) {
        clearTimeout(instructionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isScanning && hasPermission && !capturedImage && !isProcessing && countdown === 0 && !hasStartedCountdown) {
      // Hiển thị hướng dẫn, sau 3s nếu chưa chụp thì bắt đầu đếm ngược 7s
      instructionTimeoutRef.current = setTimeout(() => {
        setShowInstructions(false);
        setHasStartedCountdown(true);
        startSmartCountdown();
      }, 3000);
      return () => {
        if (instructionTimeoutRef.current) clearTimeout(instructionTimeoutRef.current);
      };
    } else if (!isScanning || capturedImage || isProcessing) {
      stopCountdown();
    }
  }, [isScanning, hasPermission, capturedImage, isProcessing, hasStartedCountdown]);

  const getCameraPermission = async () => {
    const granted = await requestCameraPermission();
    setHasPermission(granted);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startSmartCountdown = () => {
    if (countdownIntervalRef.current) return;
    
    // Start 7 second countdown - enough time to position face
    setCountdown(7);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Time to capture
          setTimeout(autoCapture, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(0);
    setHasStartedCountdown(false);
  };

  const autoCapture = async () => {
    try {
      setIsScanning(false);
      setIsProcessing(true);
      stopCountdown();
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (cameraRef.current) {
        const result = await cameraRef.current.capture();
        if (result && result.uri) {
          setCapturedImage(result.uri);
          if (mode === 'login') {
            await loginByFace(result.uri);
          } else if (mode === 'checkin') {
            await checkInByFace(result.uri);
          } else {
            await uploadFaceImage(result.uri);
          }
        }
      }
    } catch (error) {
      console.error('Auto capture error:', error);
      setIsProcessing(false);
      setIsScanning(false);
      stopCountdown();
      showErrorDialog(error);
    }
  };

  const uploadFaceImage = async (imageUri: string) => {
    try {
      // Create form data for face image upload
      const formData = new FormData();
      formData.append('FaceImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'face.jpg',
      } as any);

      const response = await apiService.updateFace(formData);
      if (response.flag) {
        showCustomToast(t('face.updateSuccess'));
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        throw new Error(response.message || t('face.updateFailed'));
      }
    } catch (error: any) {
      // Stop scanning and show error dialog
      setIsScanning(false);
      setIsProcessing(false);
      stopCountdown();
      
      showErrorDialog(error);
    }
  };

  const loginByFace = async (imageUri: string) => {
    try {
      // Create form data for face image upload
      const formData = new FormData();
      formData.append('FaceImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'face.jpg',
      } as any);

      const response = await apiService.loginByFace(formData);
      
      if (response.flag && response.data) {
        // Handle successful face login - set auth state directly
        const authData = response.data;
        const authStore = useAuthStore.getState();
        
        // Check if user is Collaborator (role: 3)
        if (authData.account.role !== 3) {
          throw new Error('WRONG_ROLE');
        }
        
        // Calculate token expiry times (copy from authStore logic)
        const AUTH_CONFIG = { TOKEN_EXPIRE_TIME: 3600, REFRESH_TOKEN_EXPIRE_TIME: 7200 }; // 1 hour and 2 hours
        const calculateExpiryTime = (expiresInSeconds: number): number => {
          return Date.now() + (expiresInSeconds * 1000);
        };
        const accessTokenExpiresAt = calculateExpiryTime(AUTH_CONFIG.TOKEN_EXPIRE_TIME);
        const refreshTokenExpiresAt = calculateExpiryTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRE_TIME);
        
        // Map response data to CombinedUserData interface (copy from authStore logic)
        const user = {
          // Account fields
          accountId: authData.account.accountId,
          username: authData.account.username,
          email: authData.account.email,
          role: authData.account.role,
          isActive: authData.account.isActive,
          isEmailVerified: authData.account.isEmailVerified,
          isOnline: authData.account.isOnline,
          lastActiveAt: authData.account.lastActiveAt,
          lastLoginDevice: authData.account.lastLoginDevice,
          lastLoginIP: authData.account.lastLoginIP,
          lastLoginLocation: authData.account.lastLoginLocation,
          accountCreatedAt: authData.account.createdAt,
          lastLogin: authData.account.lastLogin,
          
          // User fields
          userId: authData.account.userId,
          fullName: (authData.account as any).fullName || null,
          phone: authData.account.phone,
          avatarUrl: authData.account.avatar,
          gender: authData.account.gender,
          dob: authData.account.dob,
          location: authData.account.location,
        };
        
        // Set auth state directly
        const setState = useAuthStore.setState;
        setState({
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          accessTokenExpiresAt,
          refreshTokenExpiresAt,
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Set token for future API calls
        apiService.setAuthToken(authData.accessToken);
        
        showCustomToast(t('face.loginSuccess'));
        
        // No need to navigate manually - RootNavigator will automatically 
        // switch to MainNavigator when isAuthenticated becomes true
      } else {
        throw new Error(response.message || t('face.loginFailed'));
      }
    } catch (error: any) {
      // Stop scanning and show error dialog
      setIsScanning(false);
      setIsProcessing(false);
      stopCountdown();
      
      showErrorDialog(error);
    }
  };

  const checkInByFace = async (imageUri: string) => {
    try {
      // Get eventId from route params
      if (!eventId) {
        throw new Error('Event ID is required for check-in');
      }

      const response = await apiService.checkInByFace(eventId, imageUri);
      
      if (response.success && response.data) {
        // Show detailed check-in results
        const { data } = response;
        setCheckInResults(data);
        setShowCheckInResultModal(true);
        setIsProcessing(false);
      } else {
        throw new Error(response.message || t('events.faceCheckInFailed'));
      }
    } catch (error: any) {
      // Stop scanning and show error dialog
      setIsScanning(false);
      setIsProcessing(false);
      stopCountdown();
      
      showErrorDialog(error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCheckInResultClose = () => {
    setShowCheckInResultModal(false);
    setCheckInResults(null);
    navigation.goBack();
  };

  const handleCheckInResultContinue = () => {
    setShowCheckInResultModal(false);
    setCheckInResults(null);
    setCapturedImage(null);
    setIsProcessing(false);
    setIsScanning(true);
    // Reset countdown for next capture
    setCountdown(0);
    setShowInstructions(true);
  };

  const parseErrorMessage = (error: any): string => {
    if (!error) return 'unknownError';
    
    // Handle capture errors (camera issues)
    if (error.code === 'E_CAPTURE_FAILED' || error.message?.includes('takePicture failed')) {
      return 'imageReadError';
    }
    
    // Check network/timeout errors first
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'timeout';
    }
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return 'networkError';
    }

    const status = error.response?.status;
    const errorData = error.response?.data;
    let errorMessage = '';

    // Get error message from response
    if (typeof errorData === 'string') {
      errorMessage = errorData;
    } else if (errorData?.message) {
      errorMessage = errorData.message;
      // Handle nested JSON error messages
      if (typeof errorData.message === 'string' && errorData.message.startsWith('{')) {
        try {
          const nestedError = JSON.parse(errorData.message);
          if (nestedError.error) {
            errorMessage = nestedError.error;
          }
        } catch (e) {
          // Keep original message if JSON parse fails
        }
      }
    } else if (errorData?.error) {
      errorMessage = errorData.error;
    }

    // Parse AI service specific errors
    if (errorMessage.includes("'file' field is not present")) {
      return 'noFileField';
    }
    if (errorMessage.includes('No files selected')) {
      return 'noFileSelected';
    }
    if (errorMessage.includes('Error reading image')) {
      return 'imageReadError';
    }
    if (errorMessage.includes('Error extracting embedding')) {
      return 'embeddingError';
    }
    if (errorMessage.includes('Face could not be detected') || 
        errorMessage.includes('Face detection error')) {
      return 'faceNotDetected';
    }
    if (errorMessage.includes('Suspicious behavior detected') || 
        errorMessage.includes('live photos')) {
      return 'antiSpoofing';
    }

    // Handle HTTP status codes
    switch (status) {
      case 400:
        return 'faceNotDetected'; // Most 400 errors are face detection issues
      case 403:
        return 'antiSpoofing';
      case 405:
        return 'methodNotAllowed';
      case 500:
        return 'serverError';
      default:
        return 'unknownError';
    }
  };

  const showErrorDialog = (error: any) => {
    const errorKey = parseErrorMessage(error);
    const errorMsg = t(`face.errorDialog.errors.${errorKey}`);
    const errorTitle = t('face.errorDialog.title');
    
    setErrorTitle(errorTitle);
    setErrorMessage(errorMsg);
    setShowErrorModal(true);
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
  };

  const handleRetryFromError = () => {
    setShowErrorModal(false);
    // Reset all states and restart the process
    setCapturedImage(null);
    setIsProcessing(false);
    setIsScanning(true);
    setShowInstructions(true);
    stopCountdown();
  };

  const handleGoBackFromError = () => {
    setShowErrorModal(false);
    navigation.goBack();
  };

  const handleManualCapture = async () => {
    if (isProcessing) return; // chỉ disable khi đang xử lý
    stopCountdown();
    setShowInstructions(false);
    setHasStartedCountdown(false);
    setIsScanning(false);
    setIsProcessing(true);
    try {
      if (cameraRef.current) {
        const result = await cameraRef.current.capture();
        if (result && result.uri) {
          setCapturedImage(result.uri);
          if (mode === 'login') {
            await loginByFace(result.uri);
          } else if (mode === 'checkin') {
            await checkInByFace(result.uri);
          } else {
            await uploadFaceImage(result.uri);
          }
        }
      }
    } catch (error) {
      setIsProcessing(false);
      setIsScanning(false);
      stopCountdown();
      showErrorDialog(error);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{t('face.requestingPermission')}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-alt" size={80} color={currentTheme.textSecondary} />
        <Text style={styles.permissionText}>{t('face.cameraPermissionRequired')}</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={handleBack}>
          <Text style={styles.permissionButtonText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'update' ? t('face.updateFace') : 
           mode === 'checkin' ? t('events.faceCheckIn') : 
           t('face.loginByFace')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {capturedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            <View style={styles.previewOverlay}>
              <Text style={styles.previewText}>
                {isProcessing ? t('face.processing') : t('face.photoTaken')}
              </Text>
              {!isProcessing && (
                <TouchableOpacity style={styles.retryButton} onPress={handleRetryFromError}>
                  <Text style={styles.retryButtonText}>{t('face.retakePhoto')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              cameraType={mode === 'checkin' ? CameraType.Back : CameraType.Front}
              showFrame={false}
              scanBarcode={false}
            />
            
            {/* Camera Overlay */}
            <View style={styles.overlay}>
              {/* Face Outline */}
              <View style={styles.faceOutlineContainer}>
                <Animated.View 
                  style={[
                    styles.faceOutline,
                    {
                      transform: [{ scale: pulseAnimation }],
                      borderColor: 'white', // luôn là trắng
                    }
                  ]}
                >
                  <View style={styles.faceCorner} />
                  <View style={[styles.faceCorner, styles.faceCornerTopRight]} />
                  <View style={[styles.faceCorner, styles.faceCornerBottomLeft]} />
                  <View style={[styles.faceCorner, styles.faceCornerBottomRight]} />
                </Animated.View>

                {/* Face Detection Indicator */}
                {countdown > 0 && (
                  <View style={styles.faceIndicatorContainer}>
                    <Text style={styles.faceIndicatorText}>{countdown}</Text>
                    <Text style={styles.faceIndicatorSubText}>{t('face.autoCapturing')}</Text>
                  </View>
                )}
                {showInstructions && (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>{t('face.smartInstructions')}</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </View>

      {/* Bottom Controls */}
      {!capturedImage && !isProcessing && (
        <View style={styles.bottomControls}>
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={[
                styles.captureButton, 
                isProcessing && styles.captureButtonDisabled,
              ]}
              onPress={handleManualCapture}
              disabled={isProcessing}
            >
              <View style={styles.captureButtonInner}>
                <Icon name="camera-alt" size={32} color={'white'} />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Auto Capture Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{t('face.positionYourFace')}</Text>
          </View>
        </View>
      )}

      {/* Custom Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleErrorModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.errorIconContainer}>
                <Icon name="error-outline" size={48} color="#FF6B6B" />
              </View>
              <Text style={styles.modalTitle}>{errorTitle}</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{errorMessage}</Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleGoBackFromError}
              >
                <Text style={styles.cancelButtonText}>
                  {t('face.errorDialog.goBack')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.retryButton]}
                onPress={handleRetryFromError}
              >
                <Text style={styles.retryButtonText}>
                  {t('face.errorDialog.tryAgain')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
                 </View>
       </Modal>

       {/* Loading Overlay */}
       {isProcessing && (
         <View style={styles.loadingOverlay}>
           <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color="#FFFFFF" />
             <Text style={styles.loadingText}>
               {t('face.processing')}
             </Text>
           </View>
         </View>
       )}

      {/* Check-in Result Modal */}
      <CheckInResultModal
        visible={showCheckInResultModal}
        data={checkInResults}
        theme={theme === 'dark' ? 'dark' : 'light'}
        onClose={handleCheckInResultClose}
        onContinue={handleCheckInResultContinue}
      />

      {/* Custom Toast */}
      <CustomToast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={hideCustomToast}
        duration={3000}
      />
      </View>
    );
  };

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: spacing.lg,
  },
  permissionText: {
    fontSize: 18,
    color: theme.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  permissionButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 44,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOutlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  faceOutline: {
    width: 280,
    height: 350,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 140,
    position: 'relative',
  },
  faceCorner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: 'white',
    borderWidth: 3,
  },
  faceCornerTopRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  faceCornerBottomLeft: {
    bottom: -3,
    left: -3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  faceCornerBottomRight: {
    bottom: -3,
    right: -3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  faceCornerActive: {
    borderColor: '#00FF00',
  },
  faceIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceIndicatorText: {
    color: '#00FF00',
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  faceIndicatorSubText: {
    color: '#00FF00',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.lg,
    alignItems: 'center',
  },
  previewText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  captureContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingButtonText: {
    color: 'black',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  statusTextActive: {
    color: '#00FF00',
    fontWeight: 'bold',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // sửa lại hoàn toàn trong suốt
    padding: spacing.lg,
  },
  instructionsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    marginBottom: spacing.md,
  },
  modalMessage: {
    color: 'black',
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonText: {
    color: 'black',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 150,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default FaceScannerScreen;
 