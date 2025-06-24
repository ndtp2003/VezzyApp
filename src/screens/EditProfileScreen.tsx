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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { Gender } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useToast } from '../components';

const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { showSuccessToast, showErrorToast } = useToast();
  
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
    gender: user?.gender || Gender.Unknown,
    dob: user?.dob ? new Date(user.dob) : null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

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

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!formData.fullName.trim()) {
        showErrorToast(t('editProfile.errors.fullNameRequired'));
        return;
      }

      // TODO: Call API to update profile
      // const response = await apiService.updateProfile({
      //   fullName: formData.fullName,
      //   phone: formData.phone,
      //   location: formData.location,
      //   gender: formData.gender,
      //   dob: formData.dob?.toISOString(),
      // });

      // Update local store
      updateUser({
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        gender: formData.gender,
        dob: formData.dob?.toISOString(),
      });

      showSuccessToast(t('editProfile.messages.updateSuccess'));
    } catch (error) {
      showErrorToast(t('editProfile.errors.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Image
            source={{
              uri: user?.avatarUrl || 'https://via.placeholder.com/100',
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changeAvatarButton}>
            <Text style={styles.changeAvatarText}>{t('editProfile.changeAvatar')}</Text>
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
              placeholderTextColor="#999"
            />
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('editProfile.email')}</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={user?.email}
              editable={false}
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
              <Icon name="calendar-today" size={20} color="#999" />
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
              <Icon name="keyboard-arrow-down" size={24} color="#999" />
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
              placeholderTextColor="#999"
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
                <Icon name="close" size={24} color="#333" />
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
                  <Icon name="check" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changeAvatarButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  changeAvatarText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedGenderOption: {
    backgroundColor: '#f0f8ff',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedGenderOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default EditProfileScreen; 