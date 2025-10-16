# Embolo iOS Setup Guide

This guide will help you set up the Embolo Capacitor + Vite/React project to work properly on iOS with the OTP API.

## 🚀 Quick Start

1. **Run the setup script:**
   ```bash
   ./setup-ios.sh
   ```

2. **Open Xcode:**
   ```bash
   npm run ios:open
   ```

3. **Configure Info.plist** (see detailed steps below)

4. **Build and test on iOS device/simulator**

## 📱 Platform Architecture

### API Client Configuration
- **Native iOS/Android**: Points to `https://embolo.in/wp-json/eco-swift/v1`
- **Web/Localhost**: Points to `http://localhost:5173/api` (with proxy)
- **Automatic Detection**: Uses `Capacitor.isNativePlatform()` to detect environment

### Network Security
- Configured for HTTPS-only communication with embolo.in
- Handles iOS WKWebView CORS issues
- Removes problematic Origin headers on native platforms
- Enhanced error handling for network timeouts

## 🔧 Manual Setup Steps

### 1. Add iOS Platform
```bash
npm run ios:init
```

### 2. Build and Sync
```bash
npm run ios:sync
```

### 3. Configure Info.plist
Open `ios/App/App/Info.plist` and add the following configuration before the closing `</dict>` tag:

```xml
<!-- Network Security Configuration -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>embolo.in</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.2</string>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.0</string>
        </dict>
    </dict>
</dict>

<!-- URL Schemes -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.embolo.cart</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>embolo</string>
        </array>
    </dict>
</array>
```

### 4. Test API Connectivity
```bash
node test-api.js
```

## 🛠 Development Workflow

### Build Commands
```bash
# Development build
npm run build:dev

# Production build
npm run build

# iOS sync (after changes)
npm run ios:sync

# Open Xcode
npm run ios:open

# Build and run on device
npm run ios:run
```

### Debugging
1. **Enable Safari Web Inspector**: Settings > Safari > Advanced > Web Inspector
2. **Connect iOS device** and open Safari > Develop > [Device] > [App]
3. **Check console logs** for API requests and responses
4. **Network tab** shows all HTTP requests and their status

## 🔍 API Client Features

### Enhanced Error Handling
- Network timeout detection
- CORS error handling for iOS WKWebView
- Automatic token refresh
- Safe JSON parsing
- Platform-specific error messages

### Request Logging
All API requests are logged with:
- Request method and URL
- Request headers and data
- Response status and data
- Error details and stack traces

### iOS-Specific Optimizations
- Removes problematic Origin/Referer headers
- Adds `X-Requested-With` header for compatibility
- Handles `capacitor://localhost` scheme properly
- Enhanced timeout handling for mobile networks

## 🧪 Testing OTP Flow

### 1. Using the OTPPage Component
```tsx
import OTPPage from './components/OTPPage';

// For login
<OTPPage mode="login" onSuccess={() => console.log('Login success!')} />

// For registration
<OTPPage mode="register" phone="+919876543210" onSuccess={() => console.log('Registration success!')} />
```

### 2. Manual API Testing
```javascript
import apiClient from './services/apiClient';

// Test OTP request
const testOTP = async () => {
  try {
    const response = await apiClient.post('/auth/request-otp', {
      username: '+919876543210'
    });
    console.log('OTP Response:', response);
  } catch (error) {
    console.error('OTP Error:', error);
  }
};
```

## 🚨 Common Issues & Solutions

### Issue: "Network request failed"
**Solution**: Check Info.plist NSAppTransportSecurity configuration

### Issue: "CORS error" on iOS
**Solution**: The API client automatically handles this by removing Origin headers

### Issue: "Request timeout"
**Solution**: Check network connection and increase timeout in apiClient.ts

### Issue: "Invalid JSON response"
**Solution**: The API client includes safe JSON parsing with error handling

### Issue: OTP not received
**Solutions**:
1. Check phone number format (+91XXXXXXXXXX)
2. Verify API endpoint is accessible
3. Check server logs for delivery status
4. Test with email instead of phone

## 📊 Platform Detection

The app automatically detects the platform and adjusts behavior:

```javascript
import { Capacitor } from '@capacitor/core';

// Check if running on native platform
if (Capacitor.isNativePlatform()) {
  // iOS/Android specific code
  console.log('Running on:', Capacitor.getPlatform());
} else {
  // Web browser specific code
  console.log('Running on web browser');
}
```

## 🔐 Security Features

### Network Security
- HTTPS-only communication with production API
- Certificate pinning ready (can be added to capacitor.config.ts)
- Secure token storage in localStorage
- Automatic token cleanup on auth errors

### Data Protection
- Sensitive data logged only in development mode
- Token expiry handling
- Secure deep linking with custom URL schemes

## 📱 iOS Deployment Checklist

- [ ] iOS platform added (`npm run ios:init`)
- [ ] Project built successfully (`npm run build`)
- [ ] Info.plist configured with network security settings
- [ ] API connectivity tested (`node test-api.js`)
- [ ] OTP flow tested on iOS simulator
- [ ] App tested on physical iOS device
- [ ] Production build tested
- [ ] App Store Connect configuration (if deploying)

## 🆘 Support

If you encounter issues:

1. **Check the console logs** in Safari Web Inspector
2. **Verify network connectivity** with the test script
3. **Ensure Info.plist** is properly configured
4. **Test on both simulator and device**
5. **Check API server status** and logs

## 📚 Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [iOS App Transport Security](https://developer.apple.com/documentation/security/preventing_insecure_network_connections)
- [WKWebView CORS Handling](https://developer.apple.com/documentation/webkit/wkwebview)
- [Xcode Debugging Guide](https://developer.apple.com/documentation/xcode/debugging)

---

**Ready to build amazing iOS experiences with Embolo! 🚀📱**
