# Vezzy - Event Check-in Mobile Application

A React Native TypeScript application for event collaborators to manage check-ins and event operations.

## 🚀 Features

- **Multi-language Support** (English/Vietnamese)
- **Dark/Light Theme** with system preference
- **QR Code Scanning** for ticket check-ins
- **Event Management** with assigned events
- **Real-time Dashboard** with statistics
- **News & Notifications** system
- **Offline Support** with persistent storage
- **Comprehensive Error Handling**

## 🛠 Tech Stack

- **React Native CLI** (not Expo)
- **TypeScript** for type safety
- **React Navigation 6** for navigation
- **Zustand** for state management
- **TanStack Query** for server state
- **AsyncStorage** for local persistence
- **React Native Vector Icons** for UI icons
- **react-native-qrcode-scanner** for QR scanning
- **Axios** for API communication
- **i18next** for internationalization

## 📋 Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)
- Java Development Kit (JDK)

## 🔧 Installation

1. **Clone and install dependencies:**
```bash
cd Vezzy
npm install
```

2. **iOS Setup (macOS only):**
```bash
cd ios && pod install && cd ..
```

3. **Android Setup:**
```bash
# Make sure you have Android SDK and ANDROID_HOME set up
npx react-native run-android
```

4. **iOS Setup:**
```bash
npx react-native run-ios
```

## 📱 Android Icon Setup

For React Native Vector Icons to work on Android, add this to `android/app/build.gradle`:

```gradle
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
```

## 🌐 API Configuration

The API configuration is centralized in `src/utils/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://api.vezzy.site', // Gateway API - Production
  NOTIFICATION_SERVICE_URL: 'https://notification.vezzy.site', // Notification Service
};
```

## 📝 Environment Setup

The app automatically detects device language and sets appropriate defaults.

### API Endpoints

- **Base URL:** `https://api.vezzy.site` (Gateway - Recommended)
- **Notification Service:** `https://notification.vezzy.site`
- **Authentication:** JWT Bearer tokens (accessToken + refreshToken)
- **Response Format:** `{ flag: boolean, message: string, data: any }`

### Key API Routes:
- `POST /api/account/login` - User authentication
- `POST /api/account/refresh-token` - Refresh access token
- `POST /api/account/logout` - User logout
- `GET /api/event/collaborator/my-events` - Get assigned events
- `POST /api/ticketissued/checkinMobile` - Check-in via QR
- `GET /api/ticketissued/event/{eventId}/checkin-history` - Get check-in history
- `GET /api/news/active` - Get active news
- `GET /api/notification/user/{userId}` - Get notifications
- `PUT /api/notification/mark-all-read` - Mark all notifications as read

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/           # API services
├── hooks/              # Custom React hooks
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── locales/            # Translation files
└── theme/              # Theme configuration
```

## 🔐 Authentication Flow

1. App checks for stored accessToken and refreshToken on startup
2. Token validation with backend using refresh token
3. Automatic token refresh when expired
4. Automatic logout when refresh fails
5. Role-based access (only Collaborators can login)
6. Secure token storage with AsyncStorage

## 🎨 Theming

The app supports three theme modes:
- **Light Theme**
- **Dark Theme**  
- **System Theme** (follows device setting)

Theme settings are persisted and synced with the backend.

## 🌍 Internationalization

Supported languages:
- **English (en)**
- **Vietnamese (vi)**

Language is auto-detected from device settings with manual override available.

## 📊 State Management

### Stores (Zustand):
- **AuthStore** - Authentication state
- **SettingsStore** - App settings and preferences
- **EventStore** - Events and check-in data

### Features:
- Persistent storage with AsyncStorage
- Automatic hydration on app start
- Backend synchronization

## 🔍 QR Code Scanning

Features:
- Camera permission handling
- Flashlight toggle
- Real-time QR code detection
- Comprehensive error handling for check-in failures

## 📱 Performance Optimizations

- **React Query** caching and background updates
- **FlatList** virtualization for large lists
- **Image optimization** and lazy loading
- **Debounced search** inputs
- **Background app state** handling

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📦 Build Commands

```bash
# Development
npm run start

# Android
npm run android

# iOS
npm run ios

# Build Android APK
cd android && ./gradlew assembleRelease

# Build iOS (Xcode required)
# Use Xcode to build and archive
```

## 🐛 Troubleshooting

### Common Issues:

1. **Metro bundler issues:**
```bash
npx react-native start --reset-cache
```

2. **Android build issues:**
```bash
cd android && ./gradlew clean && cd ..
```

3. **iOS build issues:**
```bash
cd ios && pod install && cd ..
```

4. **Vector Icons not showing:**
- Ensure fonts.gradle is applied in Android
- For iOS, ensure pod install was run after adding the library

## 🔒 Security Features

- **JWT Token** management
- **Secure storage** with AsyncStorage
- **API request/response** interceptors
- **Error boundary** implementation
- **Input validation** and sanitization

## 📈 Error Handling

Comprehensive error handling includes:
- **Network errors** with retry mechanisms
- **Authentication errors** with auto-logout
- **API errors** with translated messages
- **Offline support** with queued requests

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use ESLint configuration
3. Write comprehensive tests
4. Update documentation
5. Follow React Native best practices

## 📄 License

This project is proprietary software for event management.

## 📞 Support

For technical support or issues, contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** December 2024
