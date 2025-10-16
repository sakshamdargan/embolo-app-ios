/**
 * Pure fetch test to bypass all axios configurations
 */
export async function testPureFetch(username: string): Promise<any> {
  console.log('🧪 Testing pure fetch without axios...');
  console.log('📧 Username:', username);
  
  try {
    const response = await fetch('https://embolo.in/wp-json/eco-swift/v1/auth/request-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    console.log('✅ Pure fetch response received');
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response not OK:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📄 Response data:', data);
    return data;

  } catch (error: any) {
    console.error('❌ Pure fetch failed:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    throw error;
  }
}
