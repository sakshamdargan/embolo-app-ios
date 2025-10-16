import { Capacitor } from '@capacitor/core';

/**
 * Simple network test to isolate iOS connectivity issues
 */
export class SimpleNetworkTest {
  
  static async testBasicConnectivity(): Promise<void> {
    console.log('🔍 Starting simple network test...');
    console.log(`📱 Platform: ${Capacitor.getPlatform()}`);
    console.log(`🏠 Native: ${Capacitor.isNativePlatform()}`);
    
    // Test 1: Basic fetch to a simple endpoint
    try {
      console.log('🧪 Test 1: Basic fetch to httpbin.org');
      const response1 = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('✅ httpbin.org test passed:', response1.status);
      const data1 = await response1.json();
      console.log('📄 Response:', data1);
    } catch (error: any) {
      console.error('❌ httpbin.org test failed:', error.message);
    }

    // Test 2: Test embolo.in domain
    try {
      console.log('🧪 Test 2: Basic fetch to embolo.in');
      const response2 = await fetch('https://embolo.in', {
        method: 'GET',
        mode: 'no-cors'
      });
      console.log('✅ embolo.in domain test passed:', response2.status);
    } catch (error: any) {
      console.error('❌ embolo.in domain test failed:', error.message);
    }

    // Test 3: Test WordPress API root
    try {
      console.log('🧪 Test 3: WordPress API root');
      const response3 = await fetch('https://embolo.in/wp-json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('✅ WordPress API root test passed:', response3.status);
      const data3 = await response3.json();
      console.log('📄 WP API Response:', data3);
    } catch (error: any) {
      console.error('❌ WordPress API root test failed:', error.message);
    }

    // Test 4: Test our specific API endpoint
    try {
      console.log('🧪 Test 4: Our API endpoint');
      const response4 = await fetch('https://embolo.in/wp-json/eco-swift/v1/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('✅ Our API endpoint test passed:', response4.status);
      const data4 = await response4.json();
      console.log('📄 Our API Response:', data4);
    } catch (error: any) {
      console.error('❌ Our API endpoint test failed:', error.message);
    }

    // Test 5: Test POST to our OTP endpoint
    try {
      console.log('🧪 Test 5: POST to OTP endpoint');
      const response5 = await fetch('https://embolo.in/wp-json/eco-swift/v1/auth/request-otp', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: '+919417569770' })
      });
      console.log('✅ OTP endpoint test passed:', response5.status);
      const data5 = await response5.json();
      console.log('📄 OTP Response:', data5);
    } catch (error: any) {
      console.error('❌ OTP endpoint test failed:', error.message);
    }

    console.log('🏁 Simple network test completed');
  }
}
