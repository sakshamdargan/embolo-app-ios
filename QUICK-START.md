# 🚀 Quick Start - OTP Debugging Setup

## ✅ What's Been Done

### 1. Installed Capacitor HTTP Plugin
- Package: `@capacitor/http@0.0.2`
- Better iOS network handling than standard fetch/axios

### 2. Updated Configuration
- `capacitor.config.ts`: Added CapacitorHttp plugin
- Enabled native HTTP for better iOS compatibility

### 3. Enhanced Auth Service
- Uses **CapacitorHttp** for iOS/Android
- Uses **axios** for web browser
- **Comprehensive logging** with 🔵 (info) and 🔴 (error) emojis
- Logs every detail: URL, headers, data, response, errors

### 4. Enhanced OTP Page
- **Live debug panel** showing real-time console logs
- **Platform information** display
- **Network status** monitoring
- **Test network** button for diagnostics
- All logs captured and displayed in the UI

### 5. Testing Tools
- `test-wordpress-endpoint.sh` - Test API from command line
- `DEBUGGING-GUIDE.md` - Complete debugging documentation

## 🎯 Next Steps

### 1. Build and Run on iOS:
```bash
# Build the web assets
npm run build

# Sync to iOS (already done)
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 2. Test the OTP Flow:
1. Run the app in Xcode (Cmd+R)
2. Navigate to login/OTP page
3. Enter a phone number or email
4. Click "Send OTP"
5. **Watch the console AND the debug panel in the app**

### 3. What You'll See:

#### In Xcode Console:
```
🔵 ============ REQUEST START ============
🔵 Platform: ios
🔵 Is Native: true
🔵 Method: POST
🔵 Full URL: https://embolo.in/wp-json/eco-swift/v1/auth/request-otp
🔵 Using CapacitorHttp for native platform
🔵 Response Status: 200
✅ ============ REQUEST SUCCESS ============
```

#### In the App UI:
- Blue section shows platform info
- Black terminal section shows live console logs
- Yellow section shows debugging tips
- All 🔵 and 🔴 logs appear in real-time

### 4. Test the WordPress Endpoint:
```bash
# Make the script executable
chmod +x test-wordpress-endpoint.sh

# Run the test
./test-wordpress-endpoint.sh
```

## 📊 What to Check

### Success Indicators:
- ✅ Platform shows "ios"
- ✅ Native shows "Yes"
- ✅ Network shows "online"
- ✅ Logs show "Using CapacitorHttp"
- ✅ Response status: 200 or 400 (400 is OK if testing with fake data)
- ✅ No "Network request failed" errors

### Failure Indicators:
- ❌ Response status: 0
- ❌ "Network request failed"
- ❌ "Failed to fetch"
- ❌ "timeout"
- ❌ "Connection blocked"

## 🐛 If You Still Have Issues

Share these details:

1. **Complete console output** from Xcode (all 🔵 and 🔴 lines)
2. **Screenshot of the debug panel** in the app
3. **Platform info** from the debug panel
4. **Result** from running `./test-wordpress-endpoint.sh`
5. **iOS version** and device type (simulator or real device)

## 📁 Files Modified

- ✅ `capacitor.config.ts` - Added CapacitorHttp plugin
- ✅ `src/services/authService.ts` - Complete rewrite with CapacitorHttp
- ✅ `src/components/OTPPage.tsx` - Added comprehensive debug panel
- ✅ `package.json` - Added @capacitor/http dependency

## 📁 Files Created

- ✅ `test-wordpress-endpoint.sh` - API endpoint test script
- ✅ `DEBUGGING-GUIDE.md` - Complete debugging documentation
- ✅ `QUICK-START.md` - This file

## 🔑 Key Features

### Automatic Platform Detection
The app automatically detects the platform and uses the appropriate HTTP client:
- **iOS/Android**: CapacitorHttp (native, better compatibility)
- **Web Browser**: Axios (standard web HTTP)

### Comprehensive Error Handling
Every error is categorized and logged:
- Network connectivity issues
- Request timeouts
- CORS/blocking issues
- HTTP error responses

### Live Debugging
You don't need to constantly check Xcode console - the debug panel shows everything live in the app itself!

## 🎉 Ready to Test!

Everything is configured and ready. Just:
1. Open Xcode: `npx cap open ios`
2. Run the app (Cmd+R)
3. Try to send OTP
4. Review the detailed logs

Good luck! 🍀
