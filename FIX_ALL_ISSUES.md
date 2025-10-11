# Complete Mobile App Fixes

## Issues to Fix:
1. ✅ Splash screen not showing custom design
2. ✅ Header/Footer overlapping with content
3. ✅ Product card UI same as web
4. ✅ Proper safe areas for status bar and navigation bar

## Steps to Apply All Fixes:

### 1. Build and Sync
```bash
npm run build
npm run android:sync
```

### 2. Verify Files Created

Check these files exist:
- `android/app/src/main/res/drawable/splash_background.xml`
- `android/app/src/main/res/drawable/splash_logo.xml`
- `android/app/src/main/res/values/colors.xml`

### 3. Clean Build (if splash not showing)
```bash
cd android
./gradlew clean
cd ..
npm run build
npm run android:sync
```

### 4. Open Android Studio
```bash
npm run android:open
```

### 5. In Android Studio:
1. **File** → **Invalidate Caches / Restart**
2. **Build** → **Clean Project**
3. **Build** → **Rebuild Project**
4. **Build** → **Build APK(s)**

## What's Been Fixed:

### Mobile CSS Updates (`src/mobile.css`)
```css
/* Header with safe area */
header[id="app-header"] {
  position: fixed !important;
  top: 0 !important;
  padding-top: var(--safe-area-inset-top) !important;
  z-index: 50 !important;
}

/* Footer with safe area */
nav[id="app-footer"] {
  position: fixed !important;
  bottom: 0 !important;
  padding-bottom: var(--safe-area-inset-bottom) !important;
  z-index: 50 !important;
}
```

### Layout Component Updated (`src/components/Layout.tsx`)
- Dynamically measures header and footer heights
- Adds proper padding to prevent overlap
- Works with safe areas on notched devices

### Splash Screen Files Created:
1. **splash_background.xml** - Green background with logo
2. **splash_logo.xml** - White circle with "E" 
3. **colors.xml** - Embolo green color
4. **styles.xml** - Updated splash theme

### Status Bar Configuration (`src/main.tsx`)
- Green status bar (#00aa63)
- Light text color
- No overlay on web view
- 2-second splash with fade-out

## Testing Checklist:

After building, verify:
- [ ] Splash screen shows green background with "EMBOLO" logo
- [ ] Status bar is green (not overlapping)
- [ ] Header (Embolo logo) visible and not cut off
- [ ] Content scrolls properly
- [ ] Bottom navigation visible and not cut off
- [ ] Floating cart button above navigation bar
- [ ] Product cards show quantity selector and "Add" button
- [ ] Search results display correctly

## If Issues Persist:

### Splash Screen Not Showing:
```bash
# Delete build folder
cd android
./gradlew clean
rm -rf app/build
cd ..

# Rebuild
npm run build
npm run android:sync
npm run android:open
```

### Overlapping Issues:
1. Clear browser cache if testing in browser
2. Force stop app on device
3. Uninstall and reinstall APK
4. Check safe area CSS variables are working

### Product Card Issues:
- Product card UI is already correct in `ProductCard.tsx`
- Shows quantity selector with +/- buttons
- Shows "Add" button with cart icon
- Should work same as web

## Quick Test Commands:

```bash
# Full clean rebuild
cd android && ./gradlew clean && cd ..
npm run build
npm run android:sync

# Open Android Studio
npm run android:open

# Or build APK directly
cd android && ./gradlew assembleDebug && cd ..
```

## Expected Result:

### On App Launch:
1. Green splash screen appears
2. White circle with "E" logo
3. After 2 seconds, fades to app
4. Green status bar at top
5. Embolo logo and icons visible (not cut off)
6. Content scrollable
7. Bottom navigation visible (not cut off)

### During Use:
- Smooth scrolling
- No overlap with system UI
- Product cards work like web version
- All buttons clickable
- Professional native app feel

## Files Modified:

✅ `src/mobile.css` - Safe area CSS
✅ `src/main.tsx` - Status bar config
✅ `src/components/Layout.tsx` - Dynamic spacing
✅ `capacitor.config.ts` - Splash config
✅ `android/app/src/main/AndroidManifest.xml` - Permissions
✅ `android/app/src/main/res/values/styles.xml` - Splash theme
✅ `android/app/src/main/res/values/colors.xml` - Colors
✅ `android/app/src/main/res/drawable/splash_background.xml` - Splash
✅ `android/app/src/main/res/drawable/splash_logo.xml` - Logo

---

**Run these commands now:**
```bash
npm run build
npm run android:sync
npm run android:open
```

Then build APK in Android Studio and test! 🚀
