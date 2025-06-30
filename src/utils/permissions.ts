import { Platform, PermissionsAndroid } from 'react-native';

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Ứng dụng cần quyền truy cập camera để quét mã QR',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Hủy',
          buttonPositive: 'Đồng ý',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // iOS permissions are handled automatically by the system
      return true;
    }
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      return hasPermission;
    } else {
      // iOS permissions are handled automatically
      return true;
    }
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}; 