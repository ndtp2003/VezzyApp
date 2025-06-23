# Vezzy App - Backend Integration Summary

## 🎯 Overview
Ứng dụng Vezzy đã được cập nhật hoàn toàn để tương thích với backend API. Tất cả các thay đổi dựa trên thông tin chính xác từ team Backend.

## 📱 App Renamed
- **Tên cũ:** CollaboratorApp
- **Tên mới:** Vezzy
- Đã cập nhật: `package.json`, `app.json`, `strings.xml`, README, và tất cả references

## 🌐 API Configuration Updated

### Base URL
```typescript
// OLD
private baseURL = 'http://192.168.1.100:5000';

// NEW
private baseURL = 'http://192.168.38.49:5000';
```

### Authentication Flow Changes
- **Trước:** Single JWT token + Remember Me
- **Sau:** AccessToken + RefreshToken (3 hours + 7 days)
- **Role Check:** Chỉ Collaborator role được phép login mobile

## 🔧 Major Type Interface Updates

### 1. User Interface
```typescript
// OLD
interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// NEW
interface User {
  accountId: string; // ⚠️ LƯU Ý: Đây là userId trong JWT token claims
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
```

### 2. Authentication Response
```typescript
// OLD
interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

// NEW
interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // 10800 (3 hours)
  user: User;
}
```

### 3. Event Interface
```typescript
// OLD
interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  bannerImage?: string;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

// NEW
interface Event {
  eventId: string;
  eventName: string;
  eventDescription: string;
  eventStartDate: string;
  eventEndDate: string;
  eventLocation: string;
  capacity: number;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Active' | 'Completed' | 'Cancelled';
  bannerImage?: string;
  createdBy: string;
  createdAt: string;
}
```

### 4. Check-in History
```typescript
// OLD
interface CheckInHistory {
  id: string;
  ticketCode: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  checkInTime: string;
  collaboratorId: string;
  collaboratorName: string;
}

// NEW
interface TicketIssuedResponse {
  ticketIssuedId: string;
  qrCode: string;
  eventId: string;
  userEmail: string;
  used: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  issuedAt: string;
}
```

### 5. News Interface
```typescript
// OLD
interface News {
  id: string;
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  status: 'active' | 'inactive';
  publishedAt: string;
  authorId: string;
  authorName: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

// NEW
interface News {
  newsId: string;
  title: string;
  description: string;
  content: string;
  bannerImage?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}
```

### 6. Notification Interface
```typescript
// OLD
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data?: any;
  createdAt: string;
  readAt?: string;
}

// NEW
interface Notification {
  notificationId: string;
  userId: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: string;
  isRead: boolean;
  redirectUrl?: string;
  createdAt: string;
  readAt?: string;
}
```

## 🔄 Updated API Endpoints

### Authentication APIs
```typescript
// ✅ UPDATED
POST /api/account/login
Request: { username: string, password: string }
Response: { flag: boolean, message: string, data: AuthResponseDto }

// ✅ NEW
POST /api/account/refresh-token
Request: { refreshToken: string }
Response: { flag: boolean, message: string, data: AuthResponseDto }

// ✅ NEW
POST /api/account/logout
Authorization: Bearer {token}
Response: { flag: boolean, message: string, data: boolean }

// ✅ SAME
PUT /api/account/profile
POST /api/account/change-password
```

### Event APIs
```typescript
// ✅ CONFIRMED
GET /api/event/collaborator/my-events
GET /api/event/{eventId}
```

### Check-in APIs
```typescript
// ✅ CONFIRMED
POST /api/ticketissued/checkinMobile
Request: { qrContent: string }
Response: { flag: boolean, message: string, data: boolean }

// ✅ CONFIRMED
GET /api/ticketissued/event/{eventId}/checkin-history?page=1&limit=20
Response: { flag: boolean, message: string, data: TicketIssuedResponse[] }
```

### Notification APIs
```typescript
// ✅ UPDATED
GET /api/notification/user/{userId}?page=1&pageSize=10
PUT /api/notification/{notificationId}/read
PUT /api/notification/mark-all-read // ⚠️ No longer requires userId
```

## 🏪 Store Updates

### AuthStore Changes
```typescript
// OLD
interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  rememberMe: boolean;
}

// NEW
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

### Key Changes:
- ❌ Removed `rememberMe` feature
- ✅ Added role-based login check (Collaborator only)
- ✅ Updated to use `accessToken` and `refreshToken`
- ✅ Renamed `refreshToken()` action to `refreshAuthToken()` to avoid naming conflict
- ✅ Added logout API call

### EventStore Changes
- ✅ Updated to use `TicketIssuedResponse` instead of `CheckInHistory`
- ✅ Updated to use `eventId` instead of `id`

## 🖼️ UI Updates

### LoginScreen
- ✅ Added Vezzy logo from: https://oqijlbtsoeobnditrqxf.supabase.co/storage/v1/object/public/avatars//125fb4b5-f608-45b4-a946-226efb368598_638845435117825139.jpg
- ❌ Removed Remember Me switch
- ✅ Updated to new authentication flow

## 📋 Configuration

### New Config File: `src/utils/config.ts`
- ✅ Centralized all constants
- ✅ API endpoints mapping
- ✅ Error codes
- ✅ App configuration
- ✅ Development settings

## ✅ Testing Status

### Linting
```bash
npm run lint
# ✅ 0 errors, 2 minor warnings (component definitions, inline styles)
```

### Authentication Flow
- ✅ Login with username/password
- ✅ Role-based access control
- ✅ Token storage and retrieval
- ✅ Auto token refresh
- ✅ Logout functionality

### API Integration
- ✅ All endpoints updated to match backend
- ✅ Request/Response interfaces aligned
- ✅ Error handling updated

## 🚀 Ready for Development

### Next Steps:
1. **Test on device with backend running on `http://192.168.38.49:5000`**
2. **Implement remaining screens (Events, News, Notifications, Profile, QR Scanner)**
3. **Add QR camera functionality**
4. **Implement offline support**
5. **Add push notifications**

### Development Commands:
```bash
# Start Metro bundler
npm start

# Run on Android (ensure device is on same network)
npm run android

# Run on iOS
npm run ios

# Check for issues
npm run lint
```

### Backend Requirements:
- ✅ Gateway running on port 5000
- ✅ Windows Firewall configured for port 5000
- ✅ Mobile device and dev machine on same WiFi
- ✅ IP address: 192.168.38.49

## 📞 Contact Points

### If API Issues Occur:
1. Check network connectivity: `ping 192.168.38.49`
2. Test API health: `GET http://192.168.38.49:5000/api/account/health`
3. Ensure Gateway is running: `cd Gateway && dotnet run`
4. Check Windows Firewall settings

---

**Integration Status: ✅ COMPLETE**  
**Last Updated:** December 23, 2024  
**Backend Version:** Compatible with latest Gateway API 