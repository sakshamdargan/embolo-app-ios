import { Capacitor } from '@capacitor/core';
import { apiClient } from '../services/apiClient';

/**
 * Network connectivity test utility for iOS debugging
 */
export class NetworkTest {
  
  /**
   * Test basic network connectivity
   */
  static async testConnectivity(): Promise<void> {
    console.log('🔍 Starting comprehensive network connectivity test...');
    console.log(`📱 Platform: ${Capacitor.getPlatform()}`);
    console.log(`🏠 Native Platform: ${Capacitor.isNativePlatform()}`);
    
    // Test 1: Simple domain resolution
    try {
      console.log('🧪 Test 1: Basic domain connectivity (Google)');
      const googleResponse = await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log('✅ Google connectivity test passed');
    } catch (error: any) {
      console.error('❌ Google connectivity test failed:', error.message);
    }

    // Test 2: embolo.in domain test
    try {
      console.log('🧪 Test 2: embolo.in domain connectivity');
      const emboloResponse = await fetch('https://embolo.in', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log('✅ embolo.in domain connectivity test passed');
    } catch (error: any) {
      console.error('❌ embolo.in domain connectivity test failed:', error.message);
    }
    
    // Test 3: API endpoint test
    try {
      console.log('🧪 Test 3: API endpoint connectivity');
      const response = await fetch('https://embolo.in/wp-json/eco-swift/v1/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('✅ API endpoint connectivity test passed');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
      
    } catch (error: any) {
      console.error('❌ API endpoint test failed:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3)
      });
    }

    // Test 4: Test with our API client
    try {
      console.log('🧪 Test 4: API Client test');
      const testData = { test: 'connectivity' };
      
      await apiClient.post('/test-endpoint', testData);
    } catch (error: any) {
      console.log('ℹ️ Expected error for test endpoint:', error.message);
    }
    
    console.log('✅ Network test completed');
  }
  
  /**
   * Test OTP endpoint specifically
   */
  static async testOTPEndpoint(username: string): Promise<void> {
    console.log('🔍 Testing OTP endpoint specifically...');
    
    // Test 1: Direct fetch
    try {
      console.log('🧪 Test 1: Direct fetch to OTP endpoint');
      const response = await fetch('https://embolo.in/wp-json/eco-swift/v1/auth/request-otp', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ username })
      });
      
      console.log('✅ Direct fetch test completed');
      console.log(`📊 Status: ${response.status}`);
      
      const responseText = await response.text();
      console.log('📄 Response:', responseText);
      
    } catch (error: any) {
      console.error('❌ Direct fetch test failed:', error);
    }

    // Test 2: Try with XMLHttpRequest
    try {
      console.log('🧪 Test 2: XMLHttpRequest to OTP endpoint');
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://embolo.in/wp-json/eco-swift/v1/auth/request-otp', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          console.log('📊 XMLHttpRequest Status:', xhr.status);
          console.log('📄 XMLHttpRequest Response:', xhr.responseText);
        }
      };
      
      xhr.onerror = function() {
        console.error('❌ XMLHttpRequest error');
      };
      
      xhr.send(JSON.stringify({ username }));
      
    } catch (error: any) {
      console.error('❌ XMLHttpRequest test failed:', error);
    }

    // Test 3: Try HTTP instead of HTTPS
    try {
      console.log('🧪 Test 3: HTTP endpoint test');
      const response = await fetch('http://embolo.in/wp-json/eco-swift/v1/auth/request-otp', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
      });
      
      console.log('✅ HTTP test completed');
      console.log(`📊 Status: ${response.status}`);
      
    } catch (error: any) {
      console.error('❌ HTTP test failed:', error);
    }
  }
}
