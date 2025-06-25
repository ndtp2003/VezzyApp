import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useLoadingStore } from '../store/loadingStore';
import { Gender } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useToast } from '../components';
import { apiService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { lightTheme, darkTheme, spacing, borderRadius, typography } from '../theme';

const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();
  const { theme } = useSettingsStore();
  const { showSuccessToast, showErrorToast } = useToast();
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);
  
  const [formData, setFormData] = useState<{
    fullName: string;
    phone: string;
    location: string;
    gender: Gender;
    dob: Date | null;
  }>({
    fullName: user?.fullName || user?.username || '',
    phone: user?.phone || '',
    location: user?.location || '',
    gender: user?.gender ?? Gender.Unknown,
    dob: user?.dob ? new Date(user.dob) : null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const genderOptions = [
    { label: t('profile.gender.male'), value: Gender.Male },
    { label: t('profile.gender.female'), value: Gender.Female },
    { label: t('profile.gender.other'), value: Gender.Other },
    { label: t('profile.gender.unknown'), value: Gender.Unknown },
  ];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dob: selectedDate }));
    }
  };

  const handleGenderSelect = (gender: Gender) => {
    setFormData(prev => ({ ...prev, gender }));
    setShowGenderModal(false);
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return t('editProfile.placeholders.selectDate');
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getSelectedGenderLabel = () => {
    const selected = genderOptions.find(option => option.value === formData.gender);
    return selected ? selected.label : t('editProfile.placeholders.selectGender');
  };

  const handleAvatarSelection = () => {
    Alert.alert(
      t('editProfile.selectAvatarSource'),
      t('editProfile.selectAvatarMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('editProfile.camera'), onPress: () => openCamera() },
        { text: t('editProfile.gallery'), onPress: () => openGallery() },
      ]
    );
  };

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      },
      handleImageResponse
    );
  };

  const openGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      },
      handleImageResponse
    );
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      setSelectedAvatar(asset.uri || null);
      
      // Upload avatar immediately after selection
      if (asset.uri) {
        await uploadAvatar(asset);
      }
    }
  };

  const uploadAvatar = async (asset: any) => {
    const { showLoading, hideLoading } = useLoadingStore.getState();
    
    try {
      setIsUploadingAvatar(true);
      showLoading(t('common.uploadingAvatar'));
      
      const formData = new FormData();
      formData.append('avatarFile', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'avatar.jpg',
      } as any);

      const response = await apiService.uploadAvatar(formData);
      
      if (response.flag && response.data) {
        // Update user with new avatar URL
        updateUser({ avatarUrl: response.data.avatarUrl });
        showSuccessToast(t('editProfile.avatarUpdateSuccess'));
      }
    } catch (error) {
      showErrorToast(t('editProfile.avatarUpdateFailed'));
      setSelectedAvatar(null); // Reset on error
    } finally {
      setIsUploadingAvatar(false);
      hideLoading();
    }
  };

  const handleSave = async () => {
    const { showLoading, hideLoading } = useLoadingStore.getState();
    
    try {
      setIsLoading(true);
      showLoading(t('common.savingProfile'));
      
      // Validate required fields
      if (!formData.fullName.trim()) {
        showErrorToast(t('editProfile.errors.fullNameRequired'));
        return;
      }

      if (!user?.email) {
        showErrorToast(t('editProfile.errors.emailRequired'));
        return;
      }

      // Prepare data for API request - try PascalCase field names
      const updateData = {
        FullName: formData.fullName,
        Email: user.email, // Required by API
        Phone: formData.phone || undefined,
        Location: formData.location || undefined,
        Gender: formData.gender, // Keep as number (enum value)
        Dob: formData.dob?.toISOString().split('T')[0] || undefined, // Format as YYYY-MM-DD
      };

      // Call API to update profile
      const response = await apiService.updateProfile(updateData as any);

      // Update local store with server response
      if (response.flag && response.data) {
        updateUser(response.data);
      } else {
        // Fallback to local update (convert back to client format)
        const localUpdateData = {
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          location: formData.location || undefined,
          gender: formData.gender,
          dob: formData.dob?.toISOString() || undefined,
        };
        updateUser(localUpdateData);
      }

      showSuccessToast(t('editProfile.messages.updateSuccess'));
      
      // Navigate back to profile after successful update
      setTimeout(() => {
        navigation.goBack();
      }, 1000); // Small delay to let user see success message
    } catch (error) {
      showErrorToast(t('editProfile.errors.updateFailed'));
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: selectedAvatar || user?.avatarUrl || 'https://via.placeholder.com/100',
              }}
              style={styles.avatar}
            />
            {isUploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <Text style={styles.uploadingText}>{t('editProfile.uploading')}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.changeAvatarButton, isUploadingAvatar && styles.changeAvatarButtonDisabled]} 
            onPress={handleAvatarSelection}
            disabled={isUploadingAvatar}
          >
            <Text style={styles.changeAvatarText}>
              {isUploadingAvatar ? t('editProfile.uploading') : t('editProfile.changeAvatar')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('editProfile.fullName')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              placeholder={t('editProfile.placeholders.fullName')}
              placeholderTextColor={currentTheme.placeholder}
            />
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('editProfile.email')}</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={user?.email}
              editable={false}
              placeholderTextColor={currentTheme.placeholder}
            />
            <Text style={styles.helperText}>{t('editProfile.emailCannotChange')}</Text>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('editProfile.phone')}</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder={t('editProfile.placeholders.phone')}
              keyboardType="phone-pad"
              placeholderTextColor={currentTheme.placeholder}
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('editProfile.dateOfBirth')}</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, !formData.dob && styles.placeholderText]}>
                {formatDateDisplay(formData.dob)}
              </Text>
              <Icon name="calendar-today" size={20} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('editProfile.gender')}</Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setShowGenderModal(true)}
            >
              <Text style={styles.pickerText}>
                {getSelectedGenderLabel()}
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('editProfile.location')}</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder={t('editProfile.placeholders.location')}
              placeholderTextColor={currentTheme.placeholder}
            />
          </View>

        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? t('common.saving') : t('common.save')}
          </Text>
        </TouchableOpacity>

      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dob || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('editProfile.selectGender')}</Text>
              <TouchableOpacity
                onPress={() => setShowGenderModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>
            
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  formData.gender === option.value && styles.selectedGenderOption,
                ]}
                onPress={() => handleGenderSelect(option.value)}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    formData.gender === option.value && styles.selectedGenderOptionText,
                  ]}
                >
                  {option.label}
                </Text>
                {formData.gender === option.value && (
                  <Icon name="check" size={20} color={currentTheme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const createStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  changeAvatarButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: theme.primary,
    backgroundColor: theme.surface,
  },
  changeAvatarButtonDisabled: {
    backgroundColor: theme.disabled,
    borderColor: theme.disabled,
  },
  changeAvatarText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: spacing.xxl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body2,
    fontWeight: '500',
    color: theme.text,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: theme.text,
    backgroundColor: theme.surface,
  },
  readOnlyInput: {
    backgroundColor: theme.disabled,
    color: theme.textSecondary,
  },
  helperText: {
    ...typography.caption,
    color: theme.textSecondary,
    marginTop: spacing.xs,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: theme.surface,
  },
  dateText: {
    ...typography.body1,
    color: theme.text,
  },
  placeholderText: {
    color: theme.placeholder,
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: theme.surface,
  },
  pickerText: {
    ...typography.body1,
    color: theme.text,
  },
  saveButton: {
    backgroundColor: theme.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  saveButtonDisabled: {
    backgroundColor: theme.disabled,
  },
  saveButtonText: {
    ...typography.button,
    color: theme.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '80%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h4,
    color: theme.text,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  selectedGenderOption: {
    backgroundColor: theme.surface,
  },
  genderOptionText: {
    ...typography.body1,
    color: theme.text,
  },
  selectedGenderOptionText: {
    color: theme.primary,
    fontWeight: '600',
  },
});

export default EditProfileScreen; 
