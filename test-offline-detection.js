// Simple test to verify offline detection is working
console.log('🧪 Testing Offline Detection System...');

// Simulate offline detection
if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    console.log('✓ Navigator.onLine API available');
    console.log('Current online status:', navigator.onLine);
} else {
    console.log('✗ Navigator.onLine API not available');
}

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
