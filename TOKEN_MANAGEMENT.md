# Token Management Logic - Vezzy App

## Overview
Ứng dụng Vezzy sử dụng hệ thống token kép (dual-token) với Access Token và Refresh Token để đảm bảo bảo mật và trải nghiệm người dùng tốt.

## Token Configuration
- **Access Token**: Hết hạn sau 3 giờ (10800 giây)
- **Refresh Token**: Hết hạn sau 7 ngày (604800 giây)
- **Role Required**: Chỉ users có role "Collaborator" mới được phép đăng nhập

## Token Storage
Tokens được lưu trữ với thông tin timestamp:
```typescript
interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // timestamp
  refreshTokenExpiresAt: number; // timestamp
  issuedAt: number; // timestamp
}
```

## Auto Token Management

### 1. Khi Login
- Nhận access token và refresh token từ backend
- Tính toán và lưu thời gian hết hạn dựa trên `expiresIn` từ response
- Lưu tokens và timestamps vào AsyncStorage

### 2. Khi Mở App (checkAuthStatus)
- Kiểm tra refresh token còn hạn không
  - Nếu refresh token hết hạn → Logout ngay lập tức
- Kiểm tra access token:
  - Nếu hết hạn hoặc sắp hết hạn (trong 5 phút) → Auto refresh
  - Nếu còn hạn → Sử dụng token hiện tại

### 3. Trước Mỗi API Call (ensureValidToken)
- Interceptor tự động kiểm tra trước khi gọi API
- Buffer time: 2 phút trước khi hết hạn
- Auto refresh nếu cần thiết
- Bỏ qua cho endpoint login và refresh-token

## Helper Functions

### `calculateExpiryTime(expiresInSeconds: number)`
Tính toán thời gian hết hạn từ timestamp hiện tại:
```typescript
const expiresAt = Date.now() + (expiresInSeconds * 1000);
```

### `isTokenExpired(expiresAt: number | null)`
Kiểm tra token đã hết hạn chưa:
```typescript
return Date.now() >= expiresAt;
```

### `isTokenExpiringSoon(expiresAt: number | null, bufferMinutes: number)`
Kiểm tra token sắp hết hạn (với buffer time):
```typescript
const bufferMs = bufferMinutes * 60 * 1000;
return Date.now() >= (expiresAt - bufferMs);
```

## Flow Diagrams

### App Startup Flow
```
App Start
    ↓
Check Tokens Exist?
    ↓ NO → Show Login
    ↓ YES
Check Refresh Token Valid?
    ↓ NO → Logout + Show Login
    ↓ YES
Check Access Token Valid?
    ↓ NO/EXPIRING → Auto Refresh → Set New Tokens
    ↓ YES → Use Current Token
    ↓
Show Main App
```

### API Request Flow
```
API Request
    ↓
Skip validation? (login/refresh endpoints)
    ↓ NO
    ↓
Check Access Token Valid?
    ↓ NO/EXPIRING → Auto Refresh
    ↓ Success → Use New Token
    ↓ Failed → Logout
    ↓ YES → Use Current Token
    ↓
Make API Request
```

## Debug Features (Development Only)

### Token Debug Info
- Access token status và thời gian hết hạn
- Refresh token status và thời gian hết hạn
- Console logs với token debug info

### Test Functions
- **Test Token**: Kiểm tra `ensureValidToken()` function
- **Refresh Token**: Manually refresh token
- Console logs hiển thị detailed token info

## Error Handling

### Các Trường Hợp Lỗi
1. **Refresh Token Expired**: Auto logout
2. **Access Token Refresh Failed**: Auto logout
3. **Network Error during Refresh**: Retry logic
4. **Invalid Role**: Prevent login

### Error Recovery
- Auto retry cho network errors
- Fallback to login screen khi token không thể recover
- Clear all stored data khi logout

## Security Considerations

### Token Security
- Tokens chỉ lưu trong secure AsyncStorage
- Không log sensitive token data trong production
- Auto clear tokens khi logout

### API Security
- Bearer token trong Authorization header
- Automatic token refresh trước khi hết hạn
- Role-based access control

## Testing

### Manual Testing
1. Login thành công → Verify tokens được lưu
2. Đóng/mở app → Verify auto refresh
3. Wait for token expiry → Verify auto refresh
4. Network offline → Verify error handling
5. Invalid credentials → Verify error handling

### Debug Commands
```javascript
// In development, access debug functions via HomeScreen
- Test Token Validation
- Manual Refresh Token
- View Console Logs for detailed info
```

## Configuration

### Constants in `config.ts`
```typescript
export const AUTH_CONFIG = {
  TOKEN_EXPIRE_TIME: 10800, // 3 hours
  REFRESH_TOKEN_EXPIRE_TIME: 604800, // 7 days
  ALLOWED_ROLES: ['Collaborator'],
};
```

### Environment Variables
- `__DEV__`: Enables debug features
- API base URL configuration
- Network timeout settings

## Best Practices

1. **Always use `ensureValidToken()`** trước khi gọi authenticated APIs
2. **Handle token expiry gracefully** với user-friendly messages
3. **Log token events** trong development mode
4. **Test edge cases** như network interruption
5. **Keep token logic centralized** trong authStore

## Migration Notes

### Changes from Previous Version
- Added `accessTokenExpiresAt` và `refreshTokenExpiresAt` fields
- Removed "Remember Me" functionality
- Added auto token refresh logic
- Enhanced error handling for token operations
- Added debug utilities for development

### Breaking Changes
- AuthStore interface updated
- API interceptor logic changed
- Storage structure modified to include timestamps 