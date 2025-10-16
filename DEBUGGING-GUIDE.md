# 🔍 OTP Network Debugging Guide

## Overview
This guide helps you debug network issues when sending OTP requests in your iOS Capacitor app.

## What We've Implemented

### 1. **Enhanced AuthService with CapacitorHttp**
- Uses `CapacitorHttp` for native platforms (iOS/Android)
- Uses `axios` for web platform
- Comprehensive console logging with 🔵 and 🔴 emojis
- Detailed error diagnostics

### 2. **Live Debug Panel in OTPPage**
- Real-time console log capture
- Platform information display
- Network status monitoring
- Test network button

### 3. **Detailed Console Logging**
Every network request logs:
- Platform (iOS/Android/Web)
- Request method and URL
- Request headers and data
- Response status and data
- Error details with diagnosis

## How to Debug

### Step 1: Open Xcode Console
```bash
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Click **Product → Run** (or Cmd+R)
2. Open **Debug Navigator** (Cmd+7)
3. Look at the **Console** output at the bottom

### Step 2: Try to Send OTP
1. Enter a valid phone number or email
2. Click "Send OTP"
3. Watch the console for logs

### Step 3: Analyze Console Output

#### ✅ Successful Request Pattern:
```
🔵 ============ REQUEST START ============
🔵 Platform: ios
🔵 Is Native: true
🔵 Using CapacitorHttp for native platform
🔵 Full URL: https://embolo.in/wp-json/eco-swift/v1/auth/request-otp
🔵 Response Status: 200
✅ ============ REQUEST SUCCESS ============
```

#### ❌ Network Error Pattern:
```
🔵 ============ REQUEST START ============
🔵 Platform: ios
🔴 ============ REQUEST FAILED ============
🔴 Error Name: Error
🔴 Error Message: Network request failed
🔴 DIAGNOSIS: Network connectivity issue
```

#### ❌ CORS/Blocking Error Pattern:
```
🔴 Response Status: 0
🔴 DIAGNOSIS: CORS or network blocking issue
```

## Common Issues and Solutions

### Issue 1: "Network request failed"
**Symptoms:**
- Error message: "Cannot connect to server"
- Response status: 0 or no response

**Solutions:**
1. Check internet connection on device/simulator
2. Verify API URL is accessible: `https://embolo.in/wp-json/eco-swift/v1`
3. Check Info.plist has proper NSAppTransportSecurity settings

### Issue 2: "Request timed out"
**Symptoms:**
- Takes 30+ seconds then fails
- Error message: "timeout"

**Solutions:**
1. Check server response time
2. Test endpoint with curl: `./test-wordpress-endpoint.sh`
3. Verify server isn't blocking requests from iOS

### Issue 3: CORS Errors (Web only)
**Symptoms:**
- Works on iOS but not in browser
- Console shows CORS policy error

**Solutions:**
1. Check WordPress CORS headers
2. Verify `Access-Control-Allow-Origin` is set on server
3. Add CORS headers to WordPress REST API

### Issue 4: iOS Specific - App Transport Security
**Symptoms:**
- Works on web but not iOS
- Error: "App Transport Security has blocked..."

**Solution:**
Check `/ios/App/App/Info.plist` has:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>embolo.in</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
        </dict>
    </dict>
</dict>
```

## Testing the WordPress Endpoint

### Test from Command Line:
```bash
chmod +x test-wordpress-endpoint.sh
./test-wordpress-endpoint.sh
```

### Test from Browser:
```javascript
fetch('https://embolo.in/wp-json/eco-swift/v1/auth/request-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ username: 'test@example.com' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Expected Responses:

#### Success (User exists):
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

#### Failure (User doesn't exist):
```json
{
  "success": false,
  "message": "User not found"
}
```

## WordPress Server Configuration

### Required CORS Headers
Add to your WordPress `functions.php` or REST API endpoint:

```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        return $value;
    });
}, 15);
```

### Verify WordPress Endpoint Exists
1. Go to: `https://embolo.in/wp-json/eco-swift/v1`
2. Should return JSON with available endpoints
3. Look for `/auth/request-otp` in the list

## Reading the In-App Debug Panel

The OTP page now includes a comprehensive debug panel showing:

### Platform Info Section (Blue):
- Current platform (ios/android/web)
- Whether running on native
- Network status (online/offline)
- API base URL

### Live Console Logs (Black Terminal):
- Real-time logs from the app
- 🔵 markers for info logs
- 🔴 markers for error logs
- Shows all request/response details

### Actions:
- **🧪 Test Network**: Runs comprehensive network diagnostic
- **🗑️ Clear Logs**: Clears the debug log display

## What to Share When Asking for Help

When reporting issues, include:

1. **Platform Info** (from debug panel)
2. **Console Logs** (all 🔵 and 🔴 lines)
3. **Exact Error Message**
4. **Test Results** from `test-wordpress-endpoint.sh`
5. **Device Type** (Simulator or real device, iOS version)

## Next Steps

1. **Build and Run:**
   ```bash
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

2. **Try to Send OTP** and watch for:
   - What platform is detected?
   - Is CapacitorHttp being used?
   - What's the exact error message?
   - What's the response status?

3. **Share Debug Output** if still having issues

## Configuration Files Changed

- ✅ `capacitor.config.ts` - Added CapacitorHttp plugin
- ✅ `src/services/authService.ts` - Enhanced with CapacitorHttp and logging
- ✅ `src/components/OTPPage.tsx` - Added comprehensive debug panel
- ✅ `test-wordpress-endpoint.sh` - Endpoint testing script

## Important Notes

- The app now uses **CapacitorHttp** for native platforms (better iOS compatibility)
- **Detailed logging** is enabled for all requests
- **Debug panel** captures all console output in real-time
- Previous `allowNavigation` issue has been addressed (removed from config)

## Support

If you continue to have issues after reviewing the debug output, share:
1. Complete console logs (with 🔵 and 🔴 markers)
2. Screenshots of the debug panel
3. Results from the endpoint test script
4. iOS version and device type
