import { Capacitor } from '@capacitor/core';

/**
 * Comprehensive iOS network diagnostic
 */
export class IOSNetworkDiagnostic {
  
  static async runFullDiagnostic(): Promise<void> {
    console.log('🔍 Starting comprehensive iOS network diagnostic...');
    console.log(`📱 Platform: ${Capacitor.getPlatform()}`);
    console.log(`🏠 Native: ${Capacitor.isNativePlatform()}`);
    console.log(`🔧 User Agent: ${navigator.userAgent}`);
    console.log(`🌐 Online Status: ${navigator.onLine}`);
    
    // Test 1: Basic connectivity check
    await this.testBasicConnectivity();
    
    // Test 2: Different fetch configurations
    await this.testFetchVariations();
    
    // Test 3: XMLHttpRequest test
    await this.testXMLHttpRequest();
    
    // Test 4: Test with different domains
    await this.testDifferentDomains();
    
    console.log('🏁 iOS network diagnostic completed');
  }
  
  private static async testBasicConnectivity(): Promise<void> {
    console.log('\n🧪 Test 1: Basic Connectivity');
    
    try {
      const response = await fetch('https://httpbin.org/get');
      console.log('✅ httpbin.org reachable:', response.status);
    } catch (error: any) {
      console.error('❌ httpbin.org failed:', error.message);
    }
  }
  
  private static async testFetchVariations(): Promise<void> {
    console.log('\n🧪 Test 2: Fetch Variations');
    
    const testUrl = 'https://embolo.in/wp-json/eco-swift/v1/auth/request-otp';
    const testData = { username: '+919417569770' };
    
    // Variation 1: Basic fetch
    try {
      console.log('🔸 Variation 1: Basic fetch');
      const response1 = await fetch(testUrl, {
        method: 'POST',
        body: JSON.stringify(testData)
      });
      console.log('✅ Basic fetch success:', response1.status);
    } catch (error: any) {
      console.error('❌ Basic fetch failed:', error.message);
    }
    
    // Variation 2: With minimal headers
    try {
      console.log('🔸 Variation 2: Minimal headers');
      const response2 = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      console.log('✅ Minimal headers success:', response2.status);
    } catch (error: any) {
      console.error('❌ Minimal headers failed:', error.message);
    }
    
    // Variation 3: No-cors mode
    try {
      console.log('🔸 Variation 3: No-cors mode');
      const response3 = await fetch(testUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      console.log('✅ No-cors mode success:', response3.status);
    } catch (error: any) {
      console.error('❌ No-cors mode failed:', error.message);
    }
    
    // Variation 4: With credentials
    try {
      console.log('🔸 Variation 4: With credentials');
      const response4 = await fetch(testUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      console.log('✅ With credentials success:', response4.status);
    } catch (error: any) {
      console.error('❌ With credentials failed:', error.message);
    }
  }
  
  private static async testXMLHttpRequest(): Promise<void> {
    console.log('\n🧪 Test 3: XMLHttpRequest');
    
    return new Promise((resolve) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://embolo.in/wp-json/eco-swift/v1/auth/request-otp', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              console.log('✅ XMLHttpRequest success:', xhr.status);
              console.log('📄 XHR Response:', xhr.responseText);
            } else {
              console.error('❌ XMLHttpRequest failed:', xhr.status, xhr.statusText);
            }
            resolve();
          }
        };
        
        xhr.onerror = function() {
          console.error('❌ XMLHttpRequest network error');
          resolve();
        };
        
        xhr.ontimeout = function() {
          console.error('❌ XMLHttpRequest timeout');
          resolve();
        };
        
        xhr.timeout = 10000; // 10 second timeout
        xhr.send(JSON.stringify({ username: '+919417569770' }));
        
      } catch (error: any) {
        console.error('❌ XMLHttpRequest exception:', error.message);
        resolve();
      }
    });
  }
  
  private static async testDifferentDomains(): Promise<void> {
    console.log('\n🧪 Test 4: Different Domains');
    
    const domains = [
      'https://google.com',
      'https://httpbin.org/post',
      'https://jsonplaceholder.typicode.com/posts',
      'https://embolo.in',
      'https://embolo.in/wp-json/'
    ];
    
    for (const domain of domains) {
      try {
        const response = await fetch(domain, {
          method: domain.includes('post') ? 'POST' : 'GET',
          mode: 'no-cors'
        });
        console.log(`✅ ${domain}: ${response.status}`);
      } catch (error: any) {
        console.error(`❌ ${domain}: ${error.message}`);
      }
    }
  }
}
