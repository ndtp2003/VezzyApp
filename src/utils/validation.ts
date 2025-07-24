/**
 * Validation utilities that match backend C# regex patterns
 * These patterns should be kept in sync with IdentityService.Application.Common.ValidationUtils
 */

// Email validation using RFC 5322 standard (simplified for mobile)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Vietnamese phone number: starts with 0 or +84, followed by 9 digits
const PHONE_REGEX = /^(\+84|0)[1-9][0-9]{8}$/;

// Username: 3-30 characters, alphanumeric and underscores only
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

// Full name: 2-50 characters, letters, spaces, and Vietnamese diacritics
// Using approximation for mobile - includes most Unicode letters and spaces
const FULL_NAME_REGEX = /^[a-zA-ZÀ-ỹ\s]{2,50}$/;

// Password: at least 8 characters, must contain uppercase, lowercase, number, and special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return { isValid: false, errorMessage: 'Email is required' };
  }

  if (email.length > 254) {
    return { isValid: false, errorMessage: 'Email cannot exceed 254 characters' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, errorMessage: 'Invalid email format' };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password || !password.trim()) {
    return { isValid: false, errorMessage: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, errorMessage: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, errorMessage: 'Password cannot exceed 128 characters' };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return { 
      isValid: false, 
      errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' 
    };
  }

  return { isValid: true };
};

export const validatePhone = (phone?: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { isValid: true }; // Phone is optional
  }

  if (!PHONE_REGEX.test(phone)) {
    return { 
      isValid: false, 
      errorMessage: 'Invalid Vietnamese phone number format. Please use format: 0xxxxxxxxx or +84xxxxxxxxx' 
    };
  }

  return { isValid: true };
};

export const validateUsername = (username: string): ValidationResult => {
  if (!username || !username.trim()) {
    return { isValid: false, errorMessage: 'Username is required' };
  }

  if (!USERNAME_REGEX.test(username)) {
    return { 
      isValid: false, 
      errorMessage: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores' 
    };
  }

  return { isValid: true };
};

export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName || !fullName.trim()) {
    return { isValid: false, errorMessage: 'Full name is required' };
  }

  if (!FULL_NAME_REGEX.test(fullName)) {
    return { 
      isValid: false, 
      errorMessage: 'Full name must be 2-50 characters long and contain only letters and spaces' 
    };
  }

  return { isValid: true };
};

export const validateDateOfBirth = (dateOfBirth?: Date): ValidationResult => {
  if (!dateOfBirth) {
    return { isValid: true }; // Date of birth is optional
  }

  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();

  // Adjust age if birthday hasn't occurred this year
  const adjustedAge = dateOfBirth.getTime() > today.getTime() - (age * 365.25 * 24 * 60 * 60 * 1000) ? age - 1 : age;

  if (dateOfBirth.getTime() > today.getTime()) {
    return { isValid: false, errorMessage: 'Date of birth cannot be in the future' };
  }

  if (adjustedAge < 13) {
    return { isValid: false, errorMessage: 'You must be at least 13 years old to register' };
  }

  if (adjustedAge > 120) {
    return { isValid: false, errorMessage: 'Invalid date of birth' };
  }

  return { isValid: true };
};

// Comprehensive validation for registration
export const validateRegistration = (
  username: string,
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  dateOfBirth?: Date
): string[] => {
  const errors: string[] = [];

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid && usernameValidation.errorMessage) {
    errors.push(usernameValidation.errorMessage);
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid && emailValidation.errorMessage) {
    errors.push(emailValidation.errorMessage);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid && passwordValidation.errorMessage) {
    errors.push(passwordValidation.errorMessage);
  }

  const fullNameValidation = validateFullName(fullName);
  if (!fullNameValidation.isValid && fullNameValidation.errorMessage) {
    errors.push(fullNameValidation.errorMessage);
  }

  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.isValid && phoneValidation.errorMessage) {
    errors.push(phoneValidation.errorMessage);
  }

  const dobValidation = validateDateOfBirth(dateOfBirth);
  if (!dobValidation.isValid && dobValidation.errorMessage) {
    errors.push(dobValidation.errorMessage);
  }

  return errors;
};

// Validation for profile updates (no username/password)
export const validateProfileUpdate = (
  fullName: string,
  email: string,
  phone?: string,
  dateOfBirth?: Date
): string[] => {
  const errors: string[] = [];

  const fullNameValidation = validateFullName(fullName);
  if (!fullNameValidation.isValid && fullNameValidation.errorMessage) {
    errors.push(fullNameValidation.errorMessage);
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid && emailValidation.errorMessage) {
    errors.push(emailValidation.errorMessage);
  }

  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.isValid && phoneValidation.errorMessage) {
    errors.push(phoneValidation.errorMessage);
  }

  const dobValidation = validateDateOfBirth(dateOfBirth);
  if (!dobValidation.isValid && dobValidation.errorMessage) {
    errors.push(dobValidation.errorMessage);
  }

  return errors;
};

// Helper function to check if Vietnamese characters are supported
export const containsVietnameseCharacters = (text: string): boolean => {
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vietnameseRegex.test(text);
};

// Export regex patterns for direct use if needed
export const VALIDATION_PATTERNS = {
  EMAIL: EMAIL_REGEX,
  PHONE: PHONE_REGEX,
  USERNAME: USERNAME_REGEX,
  FULL_NAME: FULL_NAME_REGEX,
  PASSWORD: PASSWORD_REGEX,
}; 