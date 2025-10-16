#!/bin/bash

# Embolo iOS Setup Script
# This script sets up the iOS platform for the Embolo Capacitor app

echo "🚀 Setting up Embolo iOS Platform..."

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Error: capacitor.config.ts not found. Please run this script from the project root."
    exit 1
fi

# Check if Capacitor CLI is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Build the project first
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors and try again."
    exit 1
fi

# Add iOS platform if it doesn't exist
if [ ! -d "ios" ]; then
    echo "📱 Adding iOS platform..."
    npx cap add ios
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to add iOS platform."
        exit 1
    fi
else
    echo "📱 iOS platform already exists. Syncing..."
fi

# Sync the project
echo "🔄 Syncing iOS platform..."
npx cap sync ios

if [ $? -ne 0 ]; then
    echo "❌ Failed to sync iOS platform."
    exit 1
fi

# Check if Info.plist exists and update it
INFO_PLIST_PATH="ios/App/App/Info.plist"
if [ -f "$INFO_PLIST_PATH" ]; then
    echo "📝 Info.plist found at: $INFO_PLIST_PATH"
    
    # Check if NSAppTransportSecurity is already configured
    if grep -q "NSAppTransportSecurity" "$INFO_PLIST_PATH"; then
        echo "⚠️  NSAppTransportSecurity already exists in Info.plist"
        echo "   Please manually verify the configuration matches ios-info-plist-additions.xml"
    else
        echo "📋 Please manually add the network security configuration to Info.plist"
        echo "   Copy the contents from ios-info-plist-additions.xml to $INFO_PLIST_PATH"
        echo "   Add the entries before the closing </dict> tag"
    fi
else
    echo "⚠️  Info.plist not found at expected location: $INFO_PLIST_PATH"
fi

# Create a simple test endpoint to verify API connectivity
echo "🧪 Creating API test file..."
cat > "test-api.js" << 'EOF'
// Simple API connectivity test
// Run with: node test-api.js

const https = require('https');

const testEndpoint = 'https://embolo.in/wp-json/eco-swift/v1/auth/request-otp';
const testData = JSON.stringify({
    username: 'test@example.com'
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
    }
};

console.log('🧪 Testing API connectivity to embolo.in...');

const req = https.request(testEndpoint, options, (res) => {
    console.log(`✅ Response Status: ${res.statusCode}`);
    console.log(`📡 Response Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('📥 Response Data:', parsed);
        } catch (e) {
            console.log('📥 Raw Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ API Test Failed:', error.message);
});

req.write(testData);
req.end();
EOF

echo ""
echo "✅ iOS setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Open Xcode: npm run ios:open"
echo "2. Update Info.plist with network security settings (see ios-info-plist-additions.xml)"
echo "3. Test API connectivity: node test-api.js"
echo "4. Build and run on iOS device/simulator"
echo ""
echo "🔧 Useful commands:"
echo "   npm run ios:sync    - Sync changes to iOS"
echo "   npm run ios:build   - Build for iOS"
echo "   npm run ios:run     - Build and run on device/simulator"
echo ""
echo "📱 Platform Info:"
echo "   iOS Platform: $([ -d "ios" ] && echo "✅ Added" || echo "❌ Not found")"
echo "   Build Output: $([ -d "dist" ] && echo "✅ Ready" || echo "❌ Missing")"
echo "   Capacitor Config: $([ -f "capacitor.config.ts" ] && echo "✅ Found" || echo "❌ Missing")"
echo ""
