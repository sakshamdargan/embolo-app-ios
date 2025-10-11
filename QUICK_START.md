# 🚀 Quick Start - Build Android APK

## One-Command Setup (Windows)

```bash
setup-android.bat
```

This will:
1. ✅ Install all dependencies
2. ✅ Build the web app
3. ✅ Initialize Android platform
4. ✅ Sync to Android

## Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Web App
```bash
npm run build
```

### 3. Initialize Android
```bash
npm run android:init
```

### 4. Configure Permissions

Copy permissions from `AndroidManifest-template.xml` to:
```
android/app/src/main/AndroidManifest.xml
```

**Required Permissions:**
- ✅ Location (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION)
- ✅ Notifications (POST_NOTIFICATIONS)
- ✅ Internet (INTERNET, ACCESS_NETWORK_STATE)

### 5. Sync to Android
```bash
npm run android:sync
```

### 6. Open Android Studio
```bash
npm run android:open
```

### 7. Build APK

**In Android Studio:**
- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**Or via command line:**
```bash
npm run android:build
```

## 📱 Mobile Features Included

✅ **Safe Area Support** - Works with notched devices
✅ **Status Bar Styling** - Embolo green (#00aa63)
✅ **Splash Screen** - 2-second branded splash
✅ **Location Permission** - Runtime permission request
✅ **Notification Permission** - Push notification support
✅ **No Overscroll** - Native app feel
✅ **Touch Optimized** - 44px minimum touch targets
✅ **Keyboard Handling** - Proper viewport adjustment
✅ **Portrait Lock** - Optimized for portrait mode

## 🔧 Useful Commands

```bash
# Sync changes to Android
npm run android:sync

# Open in Android Studio
npm run android:open

# Run on connected device
npm run android:run

# Build release APK
npm run android:build
```

## 📦 What's Configured

### Capacitor Config
- **App ID**: `com.embolo.cart`
- **App Name**: `Embolo`
- **Splash**: Green background, 2s duration
- **Build Type**: APK

### Installed Plugins
- `@capacitor/geolocation` - Location services
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/splash-screen` - Splash screen
- `@capacitor/status-bar` - Status bar styling

### Mobile CSS
- Safe area insets for notch
- Viewport optimization
- Touch-friendly UI
- No overscroll bounce

## 🎯 Testing

### On Emulator
1. Open Android Studio
2. Create/Start Android Virtual Device (AVD)
3. Run: `npm run android:run`

### On Physical Device
1. Enable Developer Options
2. Enable USB Debugging
3. Connect via USB
4. Run: `npm run android:run`

### Install APK Directly
1. Build APK
2. Transfer to device
3. Install and test

## 📋 Pre-Build Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Web app built (`npm run build`)
- [ ] Android platform added (`npm run android:init`)
- [ ] Permissions added to AndroidManifest.xml
- [ ] Synced to Android (`npm run android:sync`)
- [ ] Android Studio opened (`npm run android:open`)

## 🐛 Troubleshooting

### Build Fails
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

### Gradle Issues
```bash
cd android
./gradlew --stop
./gradlew clean
./gradlew assembleDebug
```

## 📱 APK Location

**Debug APK:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Release APK:**
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🚀 Next Steps

1. Test on device/emulator
2. Fix any issues
3. Build signed release APK
4. Publish to Google Play Store

## 📚 Documentation

- Full guide: `ANDROID_BUILD_GUIDE.md`
- Manifest template: `AndroidManifest-template.xml`
- Permissions utility: `src/utils/permissions.ts`

## 💡 Tips

- Always run `npm run build` before syncing
- Use `npm run android:sync` after code changes
- Test on multiple Android versions
- Check permissions are granted in app settings
- Monitor Android Studio logcat for errors

---

**Ready to build?** Run `setup-android.bat` or follow the manual steps above! 🎉
