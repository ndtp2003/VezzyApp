import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme, spacing, borderRadius, typography } from '../theme';
import { useToast } from '../components';

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
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);
  
  const { eventId } = route.params || {};

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  const performCheckIn = async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        showSuccessToast(t('qrScanner.checkInSuccess'));
      } else {
        showErrorToast(t('qrScanner.checkInError'));
      }
    } catch (error) {
      showErrorToast(t('qrScanner.checkInError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRScan = () => {
    const simulatedQR = `TICKET_${eventId || 'DEFAULT'}_${Date.now()}`;
    performCheckIn(simulatedQR);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      showErrorToast(t('qrScanner.invalidCode'));
      return;
    }
    
    setShowManualInput(false);
    performCheckIn(manualCode.trim());
    setManualCode('');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('qrScanner.title')}</Text>
        <TouchableOpacity 
          style={styles.manualButton} 
          onPress={() => setShowManualInput(true)}
        >
          <Icon name="keyboard" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerBox}>
            <View style={styles.corner} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={styles.scanLine} />
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.scanArea}
        onPress={handleQRScan}
        activeOpacity={0.8}
        disabled={isProcessing}
      >
        <View style={[styles.scanButton, isProcessing && styles.processingButton]}>
          <Icon 
            name={isProcessing ? "hourglass-empty" : "qr-code-scanner"} 
            size={32} 
            color={isProcessing ? currentTheme.disabled : currentTheme.primary} 
          />
          <Text style={[styles.scanButtonText, isProcessing && styles.processingText]}>
            {isProcessing ? t('checkin.processing') : 'Tap to Simulate Scan'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleQRScan}
          disabled={isProcessing}
        >
          <Icon name="qr-code-scanner" size={28} color="#FFFFFF" />
          <Text style={styles.controlText}>Simulate Scan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, { marginTop: spacing.sm }]} 
          onPress={() => setShowManualInput(true)}
          disabled={isProcessing}
        >
          <Icon name="keyboard" size={28} color="#FFFFFF" />
          <Text style={styles.controlText}>Manual Entry</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showManualInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Manual Entry</Text>
            <Text style={styles.modalSubtitle}>Enter ticket code manually</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter ticket code"
              placeholderTextColor={currentTheme.textSecondary}
              value={manualCode}
              onChangeText={setManualCode}
              autoFocus={true}
              multiline={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={handleManualSubmit}
              >
                <Text style={styles.submitButtonText}>{t('common.submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  scannerOverlay: {
    width: width,
    height: height * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBox: {
    width: 250,
    height: 250,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: theme.primary,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLine: {
    position: 'absolute',
    width: 200,
    height: 2,
    backgroundColor: theme.primary,
    opacity: 0.8,
  },
  scanArea: {
    position: 'absolute',
    top: height * 0.25,
    left: (width - 250) / 2,
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
  },
  processingButton: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  scanButtonText: {
    fontSize: 14,
    color: theme.primary,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  processingText: {
    color: theme.disabled,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 120,
  },
  controlText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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