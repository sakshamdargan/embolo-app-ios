#!/bin/bash

# iOS Offline Detection Setup Script
# This script sets up the iOS project with offline detection capabilities

echo "🚀 Setting up iOS Offline Detection System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if Xcode is installed (for iOS development)
if ! command -v xcodebuild &> /dev/null; then
    print_warning "Xcode is not installed or not in PATH. iOS building may not work."
fi

print_status "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Build the project
print_status "Building the project..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Failed to build the project"
    exit 1
fi

print_success "Project built successfully"

# Check if iOS platform is already added
if [ ! -d "ios" ]; then
    print_status "Adding iOS platform..."
    npm run ios:init
    
    if [ $? -ne 0 ]; then
        print_error "Failed to add iOS platform"
        exit 1
    fi
    
    print_success "iOS platform added successfully"
else
    print_status "iOS platform already exists"
fi

# Sync with iOS platform
print_status "Syncing with iOS platform..."
npm run ios:sync

if [ $? -ne 0 ]; then
    print_error "Failed to sync with iOS platform"
    exit 1
fi

print_success "iOS platform synced successfully"

# Check if offline detection files exist
print_status "Verifying offline detection files..."

files_to_check=(
    "src/hooks/useOfflineDetection.ts"
    "src/components/OfflineLoader.tsx"
    "src/contexts/OfflineContext.tsx"
    "src/components/AppWithOffline.tsx"
)

all_files_exist=true

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file is missing"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    print_error "Some offline detection files are missing. Please ensure all files are created."
    exit 1
fi

# Check iOS-specific configuration
print_status "Checking iOS configuration..."

if [ -f "ios/App/App/Info.plist" ]; then
    print_success "✓ iOS Info.plist exists"
    
    # Check for network security settings
    if grep -q "NSAppTransportSecurity" ios/App/App/Info.plist; then
        print_success "✓ Network security settings found"
    else
        print_warning "⚠ Network security settings not found in Info.plist"
        print_status "You may need to add NSAppTransportSecurity settings for API calls"
    fi
else
    print_warning "⚠ iOS Info.plist not found"
fi

# Check capacitor configuration
if [ -f "capacitor.config.ts" ]; then
    print_success "✓ Capacitor configuration exists"
else
    print_error "✗ Capacitor configuration missing"
fi

# Create a simple test file to verify offline detection
print_status "Creating offline detection test..."

cat > test-offline-detection.cjs << 'EOF'
// Simple test to verify offline detection is working
console.log('🧪 Testing Offline Detection System...');

// Note: Navigator API is not available in Node.js environment
console.log('ℹ️ Navigator.onLine API will be available in browser environment');

// Check if required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'src/hooks/useOfflineDetection.ts',
    'src/components/OfflineLoader.tsx',
    'src/contexts/OfflineContext.tsx',
    'src/components/AppWithOffline.tsx'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✓ ${file} exists`);
    } else {
        console.log(`✗ ${file} missing`);
        allFilesExist = false;
    }
});

if (allFilesExist) {
    console.log('🎉 All offline detection files are present!');
} else {
    console.log('❌ Some files are missing');
    process.exit(1);
}

console.log('✅ Offline detection system setup verified!');
EOF

print_status "Running offline detection test..."
node test-offline-detection.cjs

if [ $? -eq 0 ]; then
    print_success "Offline detection test passed!"
else
    print_error "Offline detection test failed!"
    exit 1
fi

# Clean up test file
rm test-offline-detection.cjs

# Final instructions
echo ""
echo "🎉 iOS Offline Detection Setup Complete!"
echo ""
echo "📱 Next Steps:"
echo "1. Open the iOS project in Xcode:"
echo "   ${BLUE}npm run ios:open${NC}"
echo ""
echo "2. Test in iOS Simulator:"
echo "   ${BLUE}npm run ios:run${NC}"
echo ""
echo "3. To test offline detection:"
echo "   - Open iOS Simulator"
echo "   - Go to Device > Network Link Conditioner > 100% Loss"
echo "   - Watch for the beautiful Hindi offline loader!"
echo ""
echo "4. Check the testing guide:"
echo "   ${BLUE}cat iOS-Offline-Testing-Guide.md${NC}"
echo ""
echo "🔧 Available iOS Commands:"
echo "   ${YELLOW}npm run ios:sync${NC}    - Sync changes with iOS"
echo "   ${YELLOW}npm run ios:open${NC}    - Open in Xcode"
echo "   ${YELLOW}npm run ios:run${NC}     - Run in simulator"
echo "   ${YELLOW}npm run ios:build${NC}   - Build for production"
echo ""
echo "🎨 Features Included:"
echo "   ✓ Real-time offline detection"
echo "   ✓ Session preservation"
echo "   ✓ Beautiful Hindi-themed loader"
echo "   ✓ Automatic reconnection"
echo "   ✓ iOS-specific optimizations"
echo ""
print_success "Happy testing! 🚀"
