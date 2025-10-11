@echo off
echo ========================================
echo Embolo Android App Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies!
    pause
    exit /b %errorlevel%
)
echo Dependencies installed successfully!
echo.

echo Step 2: Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo Error building web app!
    pause
    exit /b %errorlevel%
)
echo Web app built successfully!
echo.

echo Step 3: Initializing Android platform...
call npx cap add android
if %errorlevel% neq 0 (
    echo Error initializing Android platform!
    pause
    exit /b %errorlevel%
)
echo Android platform initialized!
echo.

echo Step 4: Syncing to Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo Error syncing to Android!
    pause
    exit /b %errorlevel%
)
echo Synced to Android successfully!
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open Android Studio: npm run android:open
echo 2. Add permissions to AndroidManifest.xml (see ANDROID_BUILD_GUIDE.md)
echo 3. Build APK in Android Studio
echo.
echo Or run: npm run android:open
echo.
pause
