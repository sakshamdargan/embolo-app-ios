# iOS Offline Detection System - Testing Guide

## 🎯 Overview

This guide provides comprehensive instructions for testing the offline detection system implemented for the Embolo iOS app. The system includes real-time connectivity monitoring, session preservation, and a beautiful Hindi-themed offline loader.

## 📱 Features Implemented

### 1. **Offline Detection Hook** (`src/hooks/useOfflineDetection.ts`)
- Real-time connectivity monitoring using `navigator.onLine`
- Periodic connectivity checks every 10 seconds
- iOS-specific app state change handling
- Console logging for debugging

### 2. **Offline Loader Component** (`src/components/OfflineLoader.tsx`)
- Full-screen overlay with Embolo theme (#00AA63)
- Rotating Hindi quotes every 4 seconds
- Beautiful gradient background and animations
- iOS safe area support
- Connection tips and session status

### 3. **Offline Context** (`src/contexts/OfflineContext.tsx`)
- Session preservation during offline periods
- Automatic token management in localStorage
- Route preservation and restoration
- iOS background/foreground handling

### 4. **App Integration** (`src/components/AppWithOffline.tsx`)
- Seamless integration with existing app structure
- Offline loader overlay when connection is lost
- Automatic reconnection handling

## 🛠 Setup Instructions

### Prerequisites
- Xcode 14+ installed
- iOS Simulator or physical iOS device
- Node.js and npm installed

### 1. Build the Project
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Sync with iOS platform
npm run ios:sync
```

### 2. Open in Xcode
```bash
# Open the iOS project in Xcode
npm run ios:open
```

## 🧪 Testing Procedures

### Test 1: Basic Offline Detection

1. **Start the app in iOS Simulator**
   ```bash
   npm run ios:run
   ```

2. **Monitor console logs**
   - Open Safari Developer Tools
   - Navigate to Develop > Simulator > localhost
   - Check console for offline detection logs

3. **Simulate network loss**
   - In iOS Simulator: Device > Network Link Conditioner > 100% Loss
   - Or: Settings > Developer > Network Link Conditioner > 100% Loss

4. **Expected behavior:**
   - Console shows: `[OfflineDetection] Connection lost, entering offline mode`
   - Offline loader appears with Embolo theme
   - Hindi quotes start rotating every 4 seconds

### Test 2: Session Preservation

1. **Login to the app**
   - Navigate to any protected route (e.g., /orders, /wallet)
   - Ensure you're authenticated

2. **Go offline**
   - Enable 100% packet loss in Network Link Conditioner
   - Verify offline loader appears

3. **Check session preservation**
   - Console should show: `[OfflineContext] Auth token preserved for offline session`
   - Current route should be stored in localStorage

4. **Restore connection**
   - Disable Network Link Conditioner
   - App should automatically return to the same page
   - User should remain logged in

### Test 3: Quote Rotation

1. **Go offline** and observe the offline loader
2. **Wait 4 seconds** - quote should change with fade animation
3. **Verify all quotes cycle** through the 10 Hindi quotes
4. **Check animations** - smooth transitions and pulse effects

### Test 4: iOS-Specific Features

1. **App backgrounding test**
   - Open app, go offline
   - Press home button (app goes to background)
   - Reopen app - should check connectivity automatically

2. **Safe area test**
   - Test on iPhone with notch (iPhone X+)
   - Verify offline loader respects safe areas
   - Check on different screen sizes

3. **Visibility change test**
   - Switch between apps while offline
   - Return to app - should trigger connectivity check

### Test 5: Network Recovery

1. **Start offline** with 100% packet loss
2. **Wait for periodic checks** (every 10 seconds)
3. **Restore network** gradually:
   - 100% Loss → 50% Loss → Normal
4. **Verify smooth transition** back to online state

## 🔍 Debugging

### Console Logs to Monitor

```javascript
// Initialization
[OfflineDetection] Initializing offline detection system
[OfflineDetection] Initial state: ONLINE/OFFLINE

// State changes
[OfflineDetection] Network status changed: OFFLINE at 12:34:56
[OfflineDetection] Connection lost, entering offline mode

// Session preservation
[OfflineContext] Preserving session state for offline mode
[OfflineContext] Auth token preserved for offline session

// Recovery
[OfflineDetection] Reconnected after 45 seconds offline
[OfflineContext] Restoring session state after reconnection
```

### Common Issues and Solutions

1. **Offline detection not working**
   - Check if Network Link Conditioner is properly configured
   - Verify Safari Developer Tools are connected
   - Ensure app is running in debug mode

2. **Session not preserved**
   - Check localStorage in Safari Developer Tools
   - Look for `embolo_offline_token` and `embolo_offline_route` keys
   - Verify AuthContext is properly wrapped

3. **Quotes not rotating**
   - Check React component state in developer tools
   - Verify setTimeout intervals are working
   - Look for JavaScript errors in console

## 📊 Performance Monitoring

### Key Metrics to Track

1. **Detection Speed**: Time from network loss to offline mode
2. **Recovery Speed**: Time from network restore to online mode
3. **Memory Usage**: Monitor for memory leaks during long offline periods
4. **Battery Impact**: Check if periodic checks affect battery life

### Optimization Settings

```typescript
// In useOfflineDetection.ts
const CONNECTIVITY_CHECK_INTERVAL = 10000; // 10 seconds
const FETCH_TIMEOUT = 5000; // 5 seconds
const QUOTE_ROTATION_INTERVAL = 4000; // 4 seconds
```

## 🚀 Build for Production

### Development Build
```bash
npm run build:dev
npm run ios:sync
```

### Production Build
```bash
npm run build
npm run ios:build
```

### App Store Build
1. Open Xcode project
2. Select "Any iOS Device" as target
3. Product > Archive
4. Follow App Store Connect upload process

## 📱 Device-Specific Testing

### iPhone Models to Test
- **iPhone SE (2nd gen)**: Small screen, no notch
- **iPhone 12/13**: Standard notch
- **iPhone 14 Pro**: Dynamic Island
- **iPad**: Tablet layout considerations

### iOS Versions
- **iOS 15**: Minimum supported version
- **iOS 16**: Current stable
- **iOS 17**: Latest features

## 🔧 Troubleshooting

### Network Link Conditioner Not Working
1. Enable Developer Mode in iOS Settings
2. Install Additional Tools in Xcode
3. Restart iOS Simulator

### App Not Detecting Offline State
1. Check Capacitor configuration
2. Verify network permissions in Info.plist
3. Test with actual device vs simulator

### Session Lost After Offline
1. Check localStorage persistence
2. Verify token expiration handling
3. Test with different offline durations

## 📈 Success Criteria

✅ **Offline detection works within 2 seconds of network loss**
✅ **Session preserved for offline periods up to 30 minutes**
✅ **Smooth transition back to online state**
✅ **Hindi quotes rotate properly with animations**
✅ **No memory leaks during extended offline periods**
✅ **Works on all iOS device sizes and orientations**
✅ **Proper handling of app backgrounding/foregrounding**

## 🎨 UI/UX Validation

- **Theme consistency**: Embolo green (#00AA63) used throughout
- **Typography**: Proper Hindi text rendering
- **Animations**: Smooth transitions and loading states
- **Accessibility**: VoiceOver support for offline messages
- **Safe areas**: Proper handling on all device types

This comprehensive testing guide ensures the offline detection system works perfectly across all iOS devices and scenarios!
