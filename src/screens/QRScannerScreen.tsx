import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  Modal,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Camera, CameraType } from 'react-native-camera-kit';
import { RootStackParamList, CheckInRequest, BackendApiResponse } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme, spacing, borderRadius } from '../theme';
import { useToast } from '../components';
import { apiService } from '../services/api';
import { requestCameraPermission } from '../utils/permissions';

type QRScannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QRScanner'>;
type QRScannerScreenRouteProp = RouteProp<RootStackParamList, 'QRScanner'>;

const { width, height } = Dimensions.get('window');

const QRScannerScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<QRScannerScreenNavigationProp>();
  const route = useRoute<QRScannerScreenRouteProp>();
  const { theme } = useSettingsStore();
  const { showSuccessToast, showErrorToast } = useToast();
  
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [lastScanTime, setLastScanTime] = useState(0);
  
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);
  
  const { eventId } = route.params || {};

  // Request camera permission
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const hasPermission = await requestCameraPermission();
        setHasPermission(hasPermission);
        
        if (!hasPermission) {
          showErrorToast(t('qr.cameraPermissionRequired'));
        }
      } catch (error) {
        setHasPermission(false);
        showErrorToast(t('qr.cameraPermissionError'));
      }
    };

    getCameraPermission();
  }, []);

  // Focus effect to handle scanner activation
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');
      setIsScanning(true);
      
      return () => {
        StatusBar.setBarStyle('default');
        setIsScanning(false);
      };
    }, [])
  );

  // Animation for scan line
  useEffect(() => {
    if (isScanning && !isProcessing) {
      const scanLineAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

      const pulseAnimationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      scanLineAnimation.start();
      pulseAnimationLoop.start();

      return () => {
        scanLineAnimation.stop();
        pulseAnimationLoop.stop();
      };
    }
  }, [isScanning, isProcessing]);

  const handleQRCodeDetected = (event: any) => {
    if (!isScanning || isProcessing) {
      return;
    }
    
    const currentTime = Date.now();
    let qrData = '';
    
    // Handle different event structures from react-native-camera-kit
    if (event?.nativeEvent?.codeStringValue) {
      qrData = event.nativeEvent.codeStringValue;
    } else if (event?.codeStringValue) {
      qrData = event.codeStringValue;
    } else if (typeof event === 'string') {
      qrData = event;
    } else {
      return;
    }

    // Prevent duplicate scans within 3 seconds
    if (currentTime - lastScanTime < 3000) {
      return;
    }

    // Prevent duplicate QR codes
    if (scannedCodes.includes(qrData)) {
      showErrorToast(t('qr.duplicateCode'));
      return;
    }

    // Vibrate on successful scan
    try {
      Vibration.vibrate(100);
    } catch (error) {
      // Silent fail for vibration
    }

    setLastScanTime(currentTime);
    setScannedCodes(prev => [...prev, qrData]);
    performCheckIn(qrData);
  };

  const performCheckIn = async (qrContent: string) => {
    if (isProcessing) {
      return;
    }
    
    setIsProcessing(true);
    setIsScanning(false);
    
    try {
      const checkInRequest: CheckInRequest = {
        qrContent: qrContent
      };
      
      const response: BackendApiResponse<boolean> = await apiService.checkInByQR(checkInRequest);
      
      if (response.success && response.data) {
        showSuccessToast(t('qr.checkInSuccess'), 4000);
        try {
          Vibration.vibrate([0, 200, 100, 200]);
        } catch (error) {
          // Silent fail for vibration
        }
        // Reset scanning after success to continue checking in
        setTimeout(() => {
          setIsProcessing(false);
          setIsScanning(true);
        }, 1500);
      } else {
        // Handle specific error messages from backend
        let errorMessage = t('qr.checkInFailed');
        
        switch (response.message) {
          case 'TICKET_NOT_FOUND':
            errorMessage = t('qr.ticketNotFound');
            break;
          case 'TICKET_ALREADY_USED':
            errorMessage = t('qr.ticketAlreadyUsed');
            break;
          case 'UPDATE_FAILED':
            errorMessage = t('qr.updateFailed');
            break;
          case 'LOG_CREATION_FAILED':
            errorMessage = t('qr.logCreationFailed');
            break;
          case 'CHECKIN_ERROR':
            errorMessage = t('qr.checkInError');
            break;
          default:
            errorMessage = response.message || t('qr.checkInFailed');
        }
        
        showErrorToast(errorMessage);
        try {
          Vibration.vibrate([0, 500]);
        } catch (error) {
          // Silent fail for vibration
        }
        // Reset scanning after delay
        setTimeout(() => {
          setIsProcessing(false);
          setIsScanning(true);
        }, 2000);
      }
    } catch (error: any) {
      let errorMessage = t('qr.checkInFailed');
      
      if (error.response?.status === 404) {
        errorMessage = t('qr.endpointNotFound');
      } else if (error.response?.status === 401) {
        errorMessage = t('qr.unauthorized');
      } else if (error.response?.data?.Message) {
        errorMessage = error.response.data.Message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showErrorToast(errorMessage);
      try {
        Vibration.vibrate([0, 500]);
      } catch (vibError) {
        // Silent fail for vibration
      }
      
      // Reset scanning after delay
      setTimeout(() => {
        setIsProcessing(false);
        setIsScanning(true);
      }, 2000);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      showErrorToast(t('qr.enterCodeSubtitle'));
      return;
    }
    
    setShowManualInput(false);
    performCheckIn(manualCode.trim());
    setManualCode('');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleManualInputOpen = () => {
    setIsScanning(false);
    setShowManualInput(true);
  };

  const handleManualInputClose = () => {
    setShowManualInput(false);
    setManualCode('');
    if (!isProcessing) {
      setIsScanning(true);
    }
  };

  const toggleScanning = () => {
    if (isProcessing) return;
    
    if (isScanning) {
      setIsScanning(false);
    } else {
      setIsScanning(true);
    }
  };

  const scanLineTranslateY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  // Permission denied screen
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('qr.title')}</Text>
          <View style={styles.manualButton} />
        </View>
        
        <View style={styles.permissionContainer}>
          <Icon name="camera-alt" size={80} color={currentTheme.textSecondary} />
          <Text style={styles.permissionTitle}>{t('qr.cameraPermission')}</Text>
          <Text style={styles.permissionText}>
            {t('qr.cameraPermissionMessage')}
          </Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleManualInputOpen}>
            <Text style={styles.settingsButtonText}>{t('qr.manualInput')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading screen
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Icon name="camera" size={80} color={currentTheme.primary} />
          <Text style={styles.loadingText}>{t('qr.checkingCamera')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      
      {/* Camera - Full Screen */}
      <Camera
        style={styles.camera}
        cameraType={CameraType.Back}
        onReadCode={handleQRCodeDetected}
        showFrame={false}
        laserColor="transparent"
        frameColor="transparent"
        scanBarcode={isScanning}
        ratioOverlay={'1:1'}
      />

      {/* Dark Overlay with Cut-out for Scanning Area */}
      <View style={styles.overlay}>
        {/* Top Dark Area */}
        <View style={styles.overlayTop} />
        
        {/* Middle Row with Side Dark Areas and Clear Scanning Area */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlayLeft} />
          <View style={styles.scanningArea}>
            {/* Scanner Frame */}
            <View style={styles.scannerFrame}>
              {/* Corner Indicators */}
              <Animated.View style={[styles.corner, styles.topLeft, { transform: [{ scale: pulseAnimation }] }]} />
              <Animated.View style={[styles.corner, styles.topRight, { transform: [{ scale: pulseAnimation }] }]} />
              <Animated.View style={[styles.corner, styles.bottomLeft, { transform: [{ scale: pulseAnimation }] }]} />
              <Animated.View style={[styles.corner, styles.bottomRight, { transform: [{ scale: pulseAnimation }] }]} />
              
              {/* Animated Scan Line */}
              {isScanning && !isProcessing && (
                <Animated.View 
                  style={[
                    styles.scanLine,
                    {
                      transform: [{ translateY: scanLineTranslateY }],
                    }
                  ]} 
                />
              )}
              
              {/* Center Guide */}
              <View style={styles.centerGuide}>
                {isProcessing ? (
                  <View style={styles.processingIndicator}>
                    <Icon name="hourglass-empty" size={40} color="#FFFFFF" />
                    <Text style={styles.processingLabel}>{t('qr.processing')}</Text>
                  </View>
                ) : (
                  <View style={styles.scanGuide}>
                    <Icon name="qr-code-scanner" size={40} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.scanGuideText}>{t('qr.scanTooltip')}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.overlayRight} />
        </View>
        
        {/* Bottom Dark Area */}
        <View style={styles.overlayBottom} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
                  <Text style={styles.headerTitle}>{t('qr.title')}</Text>
        <TouchableOpacity 
          style={styles.manualButton} 
          onPress={handleManualInputOpen}
          disabled={isProcessing}
        >
          <Icon name="keyboard" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Status and Instructions */}
      <View style={styles.infoContainer}>
        <Text style={styles.statusText}>
          {isProcessing 
            ? t('qr.processing')
            : isScanning
            ? t('qr.scanning')
            : t('qr.paused')
          }
        </Text>
        
        <Text style={styles.instructionText}>
          {isProcessing 
            ? t('qr.waitPlease')
            : t('qr.instruction')
          }
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
                  <TouchableOpacity 
            style={[styles.controlButton, isProcessing && styles.disabledButton]}
            onPress={handleManualInputOpen}
            disabled={isProcessing}
          >
            <Icon name="keyboard" size={20} color={currentTheme.primary} />
            <Text style={styles.controlButtonText}>{t('qr.manualInput')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.toggleButton, isProcessing && styles.disabledButton]}
            onPress={toggleScanning}
            disabled={isProcessing}
          >
            <Icon 
              name={isScanning ? "pause" : "play-arrow"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.toggleButtonText}>
              {isScanning ? t('qr.pause') : t('qr.continue')}
            </Text>
          </TouchableOpacity>
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <Icon name="check-circle" size={80} color={currentTheme.primary} />
            <Text style={styles.processingText}>{t('qr.processing')}</Text>
          </View>
        </View>
      )}

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        transparent={true}
        animationType="slide"
        onRequestClose={handleManualInputClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('qr.enterCode')}</Text>
            <Text style={styles.modalSubtitle}>{t('qr.enterCodeSubtitle')}</Text>
            <TextInput
              style={styles.codeInput}
              placeholder={t('qr.enterHere')}
              placeholderTextColor={currentTheme.textSecondary}
              value={manualCode}
              onChangeText={setManualCode}
              autoFocus={true}
              multiline={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleManualInputClose}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={handleManualSubmit}
              >
                <Text style={styles.submitButtonText}>{t('qr.checkIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SCAN_AREA_SIZE = Math.min(width * 0.7, 280);

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlayLeft: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  overlayRight: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
  },
  scanningArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.primary,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    width: SCAN_AREA_SIZE - 60,
    height: 3,
    backgroundColor: theme.primary,
    borderRadius: 2,
    opacity: 0.8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  centerGuide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanGuide: {
    alignItems: 'center',
  },
  scanGuideText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  processingIndicator: {
    alignItems: 'center',
  },
  processingLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  manualButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    zIndex: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  instructionText: {
    fontSize: 13,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 18,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    zIndex: 10,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  toggleButton: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    opacity: 0.6,
  },
  controlButtonText: {
    fontSize: 14,
    color: theme.primary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  settingsButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    color: theme.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.background,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.disabled,
  },
  submitButton: {
    backgroundColor: theme.primary,
  },
  cancelButtonText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default QRScannerScreen; 