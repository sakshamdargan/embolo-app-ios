#!/usr/bin/env node

/**
 * iOS Setup Verification Script
 * Tests the Embolo iOS Capacitor setup and API connectivity
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Embolo iOS Setup Verification');
console.log('================================\n');

// Test configuration
const API_BASE_URL = 'https://embolo.in/wp-json/eco-swift/v1';
const TEST_ENDPOINTS = [
  '/auth/request-otp',
  '/products',
  '/categories',
  '/vendors'
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if required files exist
function checkProjectStructure() {
  log('📁 Checking project structure...', 'blue');
  
  const requiredFiles = [
    'capacitor.config.ts',
    'package.json',
    'dist/index.html',
    'src/services/apiClient.ts',
    'src/services/authService.ts',
    'src/components/OTPPage.tsx',
    'ios-info-plist-additions.xml',
    'setup-ios.sh'
  ];
  
  const results = [];
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    results.push({ file, exists });
    
    if (exists) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file}`, 'red');
    }
  });
  
  const allExist = results.every(r => r.exists);
  
  if (allExist) {
    log('✅ All required files found\n', 'green');
  } else {
    log('❌ Some required files are missing\n', 'red');
  }
  
  return allExist;
}

// Test API connectivity
function testAPIConnectivity() {
  return new Promise((resolve) => {
    log('🌐 Testing API connectivity...', 'blue');
    
    const testData = JSON.stringify({
      username: 'test@example.com'
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length,
        'User-Agent': 'Embolo-iOS-Test/1.0'
      },
      timeout: 10000
    };
    
    const req = https.request(`${API_BASE_URL}/auth/request-otp`, options, (res) => {
      log(`  📡 Response Status: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'yellow');
      log(`  📋 Response Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          log(`  📥 Response Data: ${JSON.stringify(parsed, null, 2)}`);
          
          if (res.statusCode === 200 || res.statusCode === 400) {
            log('✅ API endpoint is accessible\n', 'green');
            resolve(true);
          } else {
            log('⚠️  API endpoint returned unexpected status\n', 'yellow');
            resolve(false);
          }
        } catch (e) {
          log(`  📥 Raw Response: ${data}`);
          log('⚠️  API response is not valid JSON\n', 'yellow');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      log(`❌ API connectivity test failed: ${error.message}\n`, 'red');
      resolve(false);
    });
    
    req.on('timeout', () => {
      log('❌ API request timed out\n', 'red');
      resolve(false);
    });
    
    req.write(testData);
    req.end();
  });
}

// Check Capacitor configuration
function checkCapacitorConfig() {
  log('⚙️  Checking Capacitor configuration...', 'blue');
  
  try {
    const configPath = path.join(__dirname, 'capacitor.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const checks = [
      { name: 'webDir: dist', pattern: /webDir:\s*['"]dist['"]/, required: true },
      { name: 'iOS scheme configuration', pattern: /iosScheme:\s*['"]https['"]/, required: true },
      { name: 'iOS contentInset', pattern: /contentInset:\s*['"]always['"]/, required: true },
      { name: 'App ID', pattern: /appId:\s*['"]com\.embolo\.cart['"]/, required: true }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
      const passed = check.pattern.test(configContent);
      
      if (passed) {
        log(`  ✅ ${check.name}`, 'green');
      } else if (check.required) {
        log(`  ❌ ${check.name}`, 'red');
        allPassed = false;
      } else {
        log(`  ⚠️  ${check.name}`, 'yellow');
      }
    });
    
    if (allPassed) {
      log('✅ Capacitor configuration looks good\n', 'green');
    } else {
      log('❌ Capacitor configuration needs attention\n', 'red');
    }
    
    return allPassed;
  } catch (error) {
    log(`❌ Failed to read Capacitor config: ${error.message}\n`, 'red');
    return false;
  }
}

// Check package.json scripts
function checkPackageScripts() {
  log('📦 Checking package.json scripts...', 'blue');
  
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = [
      'ios:init',
      'ios:sync',
      'ios:open',
      'ios:build',
      'ios:run'
    ];
    
    let allPresent = true;
    
    requiredScripts.forEach(script => {
      if (packageContent.scripts && packageContent.scripts[script]) {
        log(`  ✅ ${script}`, 'green');
      } else {
        log(`  ❌ ${script}`, 'red');
        allPresent = false;
      }
    });
    
    if (allPresent) {
      log('✅ All iOS scripts are configured\n', 'green');
    } else {
      log('❌ Some iOS scripts are missing\n', 'red');
    }
    
    return allPresent;
  } catch (error) {
    log(`❌ Failed to read package.json: ${error.message}\n`, 'red');
    return false;
  }
}

// Check if iOS platform exists
function checkiOSPlatform() {
  log('📱 Checking iOS platform...', 'blue');
  
  const iosPath = path.join(__dirname, 'ios');
  const exists = fs.existsSync(iosPath);
  
  if (exists) {
    log('✅ iOS platform directory exists', 'green');
    
    // Check for key iOS files
    const iosFiles = [
      'ios/App/App/Info.plist',
      'ios/App/App.xcodeproj/project.pbxproj'
    ];
    
    iosFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        log(`  ✅ ${file}`, 'green');
      } else {
        log(`  ❌ ${file}`, 'red');
      }
    });
    
    log('');
  } else {
    log('⚠️  iOS platform not initialized yet', 'yellow');
    log('   Run: npm run ios:init\n', 'blue');
  }
  
  return exists;
}

// Main test function
async function runTests() {
  const results = {
    structure: false,
    config: false,
    scripts: false,
    ios: false,
    api: false
  };
  
  // Run all tests
  results.structure = checkProjectStructure();
  results.config = checkCapacitorConfig();
  results.scripts = checkPackageScripts();
  results.ios = checkiOSPlatform();
  results.api = await testAPIConnectivity();
  
  // Summary
  log('📊 Test Summary', 'blue');
  log('==============');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${test.toUpperCase().padEnd(12)} ${status}`, color);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  log('');
  
  if (allPassed) {
    log('🎉 All tests passed! Your iOS setup is ready.', 'green');
    log('');
    log('Next steps:', 'blue');
    log('1. Run: npm run ios:init (if iOS platform not initialized)');
    log('2. Run: npm run ios:open');
    log('3. Configure Info.plist with network security settings');
    log('4. Build and test on iOS device/simulator');
  } else {
    log('⚠️  Some tests failed. Please review the issues above.', 'yellow');
    log('');
    log('Common fixes:', 'blue');
    log('- Run the setup script: ./setup-ios.sh');
    log('- Check capacitor.config.ts configuration');
    log('- Ensure all required files are present');
    log('- Test network connectivity');
  }
  
  log('');
  log('📚 For detailed setup instructions, see: README-iOS-Setup.md', 'blue');
}

// Run the tests
runTests().catch(error => {
  log(`❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
