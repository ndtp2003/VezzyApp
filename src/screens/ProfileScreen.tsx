import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiService } from '../services/api';
import { UpdateProfileRequest } from '../types';
import { lightTheme, darkTheme, spacing, borderRadius, typography, shadows } from '../theme';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { isValidEmail, isValidPhone } from '../utils/index';

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { theme } = useSettingsStore();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(currentTheme);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
    location: user?.location || '',
    avatarUrl: user?.avatar || '',
  });

  const [errors, setErrors] = useState<Partial<UpdateProfileRequest>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        dob: user.dob || '',
        gender: user.gender || '',
        location: user.location || '',
        avatarUrl: user.avatar || '',
      });
    }
  }, [user]);

  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdateProfileRequest> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.updateProfile(formData);
      
      if (response.flag) {
        updateUser(response.data);
        setIsEditing(false);
        showSuccessToast('Profile updated successfully');
      } else {
        showErrorToast(response.message);
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      showErrorToast('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        dob: user.dob || '',
        gender: user.gender || '',
        location: user.location || '',
        avatarUrl: user.avatar || '',
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType: any = 'default',
    multiline = false,
    error?: string
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.textInput, error && styles.textInputError, multiline && styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={currentTheme.textSecondary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ 
              uri: formData.avatarUrl || 'https://via.placeholder.com/100x100/cccccc/666666?text=User' 
            }}
            style={styles.avatar}
          />
          {isEditing && (
            <TouchableOpacity style={styles.avatarEditButton}>
              <Icon name="camera-alt" size={20} color={currentTheme.background} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userRole}>{user.role}</Text>
      </View>

      {/* Profile Form */}
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        {renderField(
          'Full Name',
          formData.fullName,
          (text) => setFormData(prev => ({ ...prev, fullName: text })),
          'Enter full name',
          'default',
          false,
          errors.fullName
        )}

        {renderField(
          'Email',
          formData.email,
          (text) => setFormData(prev => ({ ...prev, email: text })),
          'Enter email',
          'email-address',
          false,
          errors.email
        )}

        {renderField(
          'Phone',
          formData.phone,
          (text) => setFormData(prev => ({ ...prev, phone: text })),
          'Enter phone number',
          'phone-pad',
          false,
          errors.phone
        )}

        {/* Gender Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Gender</Text>
          {isEditing ? (
            <TouchableOpacity
              style={[styles.textInput, errors.gender && styles.textInputError]}
              onPress={() => setShowGenderPicker(true)}
            >
              <Text style={formData.gender ? styles.fieldValue : styles.placeholderText}>
                {formData.gender || 'Select gender'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.fieldValue}>
              {formData.gender || 'Not provided'}
            </Text>
          )}
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
        </View>

        {renderField(
          'Date of Birth',
          formData.dob ? formatDate(formData.dob) : '',
          (text) => setFormData(prev => ({ ...prev, dob: text })),
          'YYYY-MM-DD',
          'default',
          false,
          errors.dob
        )}

        <Text style={styles.sectionTitle}>Additional Information</Text>

        {renderField(
          'Location',
          formData.location,
          (text) => setFormData(prev => ({ ...prev, location: text })),
          'Enter your location',
          'default',
          true,
          errors.location
        )}

        {/* Account Information */}
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Username</Text>
          <Text style={styles.fieldValue}>{user.username}</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Account ID</Text>
          <Text style={styles.fieldValue}>{user.accountId}</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Joined Date</Text>
          <Text style={styles.fieldValue}>{user.createdAt ? formatDate(user.createdAt) : 'Not available'}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Icon name="check" size={20} color={currentTheme.background} />
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Icon name="close" size={20} color={currentTheme.error} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Icon name="edit" size={20} color={currentTheme.background} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.genderOption}
                onPress={() => {
                  setFormData(prev => ({ ...prev, gender: option.value }));
                  setShowGenderPicker(false);
                }}
              >
                <Text style={styles.genderOptionText}>{option.label}</Text>
                {formData.gender === option.value && (
                  <Icon name="check" size={20} color={currentTheme.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowGenderPicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    ...typography.body1,
    color: theme.textSecondary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.card,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    ...typography.h3,
    color: theme.text,
    marginBottom: spacing.xs,
  },
  userRole: {
    ...typography.body2,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  form: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h5,
    color: theme.text,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    fontWeight: 'bold',
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.body2,
    color: theme.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  fieldValue: {
    ...typography.body1,
    color: theme.text,
    padding: spacing.md,
    backgroundColor: theme.card,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  textInput: {
    ...typography.body1,
    color: theme.text,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: theme.error,
  },
  placeholderText: {
    color: theme.textSecondary,
  },
  errorText: {
    ...typography.caption,
    color: theme.error,
    marginTop: spacing.xs,
  },
  actionButtons: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  editButton: {
    backgroundColor: theme.primary,
  },
  editButtonText: {
    ...typography.button,
    color: theme.background,
  },
  saveButton: {
    backgroundColor: theme.success,
  },
  saveButtonText: {
    ...typography.button,
    color: theme.background,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.error,
  },
  cancelButtonText: {
    ...typography.button,
    color: theme.error,
  },
  // Modal styles
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
    margin: spacing.lg,
    minWidth: 280,
    ...shadows.lg,
  },
  modalTitle: {
    ...typography.h5,
    color: theme.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  genderOptionText: {
    ...typography.body1,
    color: theme.text,
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  modalCancelText: {
    ...typography.button,
    color: theme.primary,
  },
});

export default ProfileScreen; 