# Android APK Build Guide - Embolo App

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Android Studio** (latest version)
3. **Java JDK 17** (required for Capacitor 7)
4. **Gradle** (comes with Android Studio)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required Capacitor plugins:
- `@capacitor/geolocation` - For location permissions
- `@capacitor/push-notifications` - For notification permissions
- `@capacitor/splash-screen` - For splash screen
- `@capacitor/status-bar` - For status bar styling

### 2. Build the Web App

```bash
npm run build
```

This creates the production build in the `dist` folder.

### 3. Initialize Android Platform

```bash
npm run android:init
```

This creates the `android` folder with all Android project files.

### 4. Sync Web Build to Android

```bash
npm run android:sync
```

This copies your web build to the Android project and updates native dependencies.

### 5. Open in Android Studio

```bash
npm run android:open
```

This opens the Android project in Android Studio.

## Android Permissions Configuration

The following permissions are automatically configured:

### AndroidManifest.xml Permissions

After running `android:init`, manually add these permissions to:
`android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Location Permissions -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" />
    
    <!-- Notification Permissions -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Internet & Network -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Other -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/app_name"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## Building APK

### Debug APK (for testing)

In Android Studio:
1. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for production)

#### Option 1: Using Android Studio

1. Click **Build** → **Generate Signed Bundle / APK**
2. Select **APK**
3. Create or select keystore
4. Fill in keystore details
5. Select **release** build variant
6. Click **Finish**

#### Option 2: Using Command Line

```bash
npm run android:build
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## App Configuration

### App Name & ID

Configured in `capacitor.config.ts`:
- **App ID**: `com.embolo.cart`
- **App Name**: `Embolo`

### Splash Screen

- **Background Color**: `#00aa63` (Embolo green)
- **Duration**: 2 seconds

### Status Bar

- Automatically styled to match app theme
- Safe area insets handled for notch devices

## Mobile Optimizations

The app includes:

✅ **Safe Area Support** - Works with notched devices
✅ **No Overscroll** - Prevents bounce effect
✅ **Touch Optimized** - 44px minimum touch targets
✅ **Viewport Handling** - Proper height calculation
✅ **Keyboard Handling** - Adjusts for on-screen keyboard
✅ **Pull-to-Refresh Disabled** - Native app behavior

## Testing on Device

### Via USB

1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run:
```bash
npm run android:run
```

### Via APK Install

1. Build APK (debug or release)
2. Transfer APK to device
3. Install APK
4. Grant permissions when prompted

## Permissions Runtime Request

The app will request permissions at runtime:

1. **Location** - When user needs location features
2. **Notifications** - When app needs to send notifications

Users can grant/deny these in app settings.

## Troubleshooting

### Gradle Build Failed

```bash
cd android
./gradlew clean
cd ..
npm run android:sync
```

### App Not Updating

```bash
npm run build
npx cap sync android
```

### Clear Cache

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

## App Size Optimization

To reduce APK size:

1. Enable ProGuard (minification)
2. Use Android App Bundle (.aab) instead of APK
3. Remove unused resources

## Publishing to Google Play Store

1. Build signed release APK or AAB
2. Create Google Play Console account
3. Upload APK/AAB
4. Fill in store listing details
5. Submit for review

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Build web app
npm run build

# Initialize Android
npm run android:init

# Sync to Android
npm run android:sync

# Open Android Studio
npm run android:open

# Build release APK
npm run android:build

# Run on device
npm run android:run
```

## Support

For issues:
- Check Capacitor docs: https://capacitorjs.com/docs/android
- Android Studio logs
- `adb logcat` for device logs
