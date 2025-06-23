import { Alert, ToastAndroid, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: 'short' | 'long';
  position?: 'top' | 'bottom' | 'center';
}

export const showToast = (
  message: string, 
  type: ToastType = 'info', 
  options: ToastOptions = {}
) => {
  const { duration = 'short' } = options;
  
  if (Platform.OS === 'android') {
    const toastDuration = duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT;
    ToastAndroid.show(message, toastDuration);
  } else {
    // For iOS, we use Alert as a fallback
    // In a real app, you might want to use a library like react-native-toast-message
    Alert.alert(
      getToastTitle(type),
      message,
      [{ text: 'OK', style: 'default' }]
    );
  }
};

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  showToast(message, 'success', options);
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
  showToast(message, 'error', options);
};

export const showWarningToast = (message: string, options?: ToastOptions) => {
  showToast(message, 'warning', options);
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
  showToast(message, 'info', options);
};

const getToastTitle = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
    default:
      return 'Info';
  }
};

export const showConfirmDialog = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = 'OK',
  cancelText: string = 'Cancel'
) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: 'default',
        onPress: onConfirm,
      },
    ]
  );
}; 