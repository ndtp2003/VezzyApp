# Development Guide - Vezzy

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio with Android SDK
- Java Development Kit (JDK 11 or later)
- For iOS: Xcode (macOS only)

### Initial Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start Metro bundler:**
```bash
npm start
```

3. **Run on Android:**
```bash
npm run android
```

4. **Run on iOS (macOS only):**
```bash
cd ios && pod install && cd ..
npm run ios
```

## 🛠 Development Workflow

### Code Structure

```
src/
├── components/         # Reusable UI components
├── screens/           # Screen components
├── navigation/        # React Navigation setup
├── services/          # API and external services
├── store/             # Zustand state management
├── hooks/             # Custom React hooks
├── utils/             # Utility functions and helpers
├── types/             # TypeScript type definitions
├── locales/           # i18n translation files
└── theme/             # Theme and styling
```

### State Management (Zustand)

#### AuthStore
```typescript
const { login, logout, user, isAuthenticated } = useAuthStore();
```

#### EventStore
```typescript
const { 
  assignedEvents, 
  fetchAssignedEvents, 
  checkInByQR,
  selectedEvent 
} = useEventStore();
```

#### SettingsStore
```typescript
const { 
  language, 
  theme, 
  setLanguage, 
  setTheme 
} = useSettingsStore();
```

### API Integration

#### Configuration
Update API base URL in `src/services/api.ts`:
```typescript
private baseURL = 'http://192.168.1.XXX:5000';
```

#### Error Handling
All API errors are handled through `handleApiError` utility:
```typescript
import { handleApiError } from '../utils';

try {
  await apiCall();
} catch (error) {
  const message = handleApiError(error, t);
  showErrorToast(message);
}
```

## 🎨 UI Development

### Theming
Use the theme system for consistent styling:
```typescript
import { lightTheme, darkTheme, spacing, typography } from '../theme';

const styles = createStyles(currentTheme);
```

### Icons
Use React Native Vector Icons:
```typescript
import Icon from 'react-native-vector-icons/MaterialIcons';

<Icon name="home" size={24} color={theme.primary} />
```

### Translations
Use i18next for text:
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<Text>{t('login.title')}</Text>
```

## 🔧 Configuration Files

### Environment Variables
Create `.env` file for environment-specific settings:
```
API_BASE_URL=http://192.168.1.100:5000
DEBUG_MODE=true
```

### TypeScript Configuration
The project uses strict TypeScript configuration. Key files:
- `tsconfig.json` - Main TypeScript config
- `src/types/index.ts` - Global type definitions

## 📱 Platform-Specific Development

### Android
- **Debug Build:** `npm run android`
- **Release Build:** `cd android && ./gradlew assembleRelease`
- **Clean Build:** `cd android && ./gradlew clean`

### iOS (macOS only)
- **Debug Build:** `npm run ios`
- **Pod Install:** `cd ios && pod install`
- **Clean Build:** Product → Clean Build Folder in Xcode

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests (Detox)
```bash
npm run test:e2e:ios
npm run test:e2e:android
```

### Manual Testing Checklist
- [ ] Login/Logout flow
- [ ] QR code scanning
- [ ] Event list loading
- [ ] Theme switching
- [ ] Language switching
- [ ] Offline functionality
- [ ] Push notifications

## 🔍 Debugging

### React Native Debugger
1. Install React Native Debugger
2. Enable Debug JS Remotely in dev menu
3. Use Chrome DevTools for debugging

### Flipper Integration
The app is configured with Flipper for advanced debugging:
- Network requests
- State inspection
- Performance monitoring

### Common Debug Commands
```bash
# Reset Metro cache
npx react-native start --reset-cache

# Clear React Native cache
npx react-native-clean-project

# Reset Android build
cd android && ./gradlew clean && cd ..

# Reset iOS build
cd ios && rm -rf build && pod install && cd ..
```

## 📦 Build & Deployment

### Android APK
```bash
cd android
./gradlew assembleRelease
# APK located at: android/app/build/outputs/apk/release/
```

### Android Bundle (AAB)
```bash
cd android
./gradlew bundleRelease
# AAB located at: android/app/build/outputs/bundle/release/
```

### iOS Build
1. Open `ios/CollaboratorApp.xcworkspace` in Xcode
2. Select target device/simulator
3. Product → Build or Archive

## 🚀 Performance Optimization

### Bundle Analysis
```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android-bundle.js --verbose
```

### Image Optimization
- Use WebP format when possible
- Implement lazy loading for images
- Use appropriate image sizes for different screen densities

### Memory Management
- Monitor memory usage with Flipper
- Use FlatList for large lists
- Implement proper cleanup in useEffect hooks

## 🔒 Security Considerations

### API Security
- Always use HTTPS in production
- Implement proper token refresh logic
- Store sensitive data securely with AsyncStorage

### Code Security
- Obfuscate release builds
- Remove console.logs in production
- Validate all user inputs

## 📊 Analytics & Monitoring

### Crash Reporting
- Crashlytics integration ready
- Error boundary implementation

### Performance Monitoring
- React Native Performance monitoring
- Custom performance metrics

## 🤝 Contributing Guidelines

### Code Style
- Use ESLint configuration
- Follow TypeScript strict mode
- Use Prettier for formatting

### Git Workflow
1. Create feature branch from `develop`
2. Make changes with descriptive commits
3. Create pull request
4. Code review and merge

### Pull Request Template
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes

## 🐛 Common Issues & Solutions

### Metro Bundle Issues
```bash
npx react-native start --reset-cache
rm -rf node_modules && npm install
```

### Android Build Issues
```bash
cd android && ./gradlew clean && cd ..
rm -rf node_modules && npm install
```

### iOS Pod Issues
```bash
cd ios && pod deintegrate && pod install && cd ..
```

### Vector Icons Not Showing
- Android: Ensure fonts.gradle is applied
- iOS: Run pod install after adding library
- Clear cache and rebuild

## 📈 Performance Benchmarks

### Target Metrics
- App startup time: < 3 seconds
- Screen transition: < 300ms
- API response handling: < 500ms
- Memory usage: < 100MB baseline

### Monitoring Tools
- React Native Performance Monitor
- Flipper Performance Plugin
- Android Profiler
- Xcode Instruments

---

**Happy Coding! 🚀** 