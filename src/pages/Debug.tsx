import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import apiClient from '../services/apiClient';

const Debug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [apiTest, setApiTest] = useState<string>('Not tested');

  useEffect(() => {
    console.log('🐛 Debug page mounted');
    
    const info = {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      baseURL: apiClient.getBaseURL(),
      userAgent: navigator.userAgent,
      location: window.location.href,
      localStorage: {
        token: !!localStorage.getItem('eco_swift_token'),
        user: !!localStorage.getItem('eco_swift_user')
      }
    };
    
    console.log('🐛 Debug info:', info);
    setDebugInfo(info);
    
    // Test API connectivity
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      console.log('🧪 Testing API connectivity...');
      setApiTest('Testing...');
      
      const result = await apiClient.testConnection();
      setApiTest(result ? 'Success' : 'Failed');
      console.log('🧪 API test result:', result);
    } catch (error: any) {
      console.error('🧪 API test error:', error);
      setApiTest(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00aa63] to-[#009955] p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Debug Information</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Platform Info</h2>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>Platform:</strong> {debugInfo.platform}</p>
              <p><strong>Is Native:</strong> {debugInfo.isNative ? 'Yes' : 'No'}</p>
              <p><strong>API Base URL:</strong> {debugInfo.baseURL}</p>
              <p><strong>Current Location:</strong> {debugInfo.location}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700">Storage Info</h2>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>Has Token:</strong> {debugInfo.localStorage?.token ? 'Yes' : 'No'}</p>
              <p><strong>Has User:</strong> {debugInfo.localStorage?.user ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700">API Connectivity</h2>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>Status:</strong> <span className={apiTest === 'Success' ? 'text-green-600' : apiTest === 'Failed' ? 'text-red-600' : 'text-yellow-600'}>{apiTest}</span></p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700">User Agent</h2>
            <div className="bg-gray-100 p-3 rounded text-xs break-all">
              {debugInfo.userAgent}
            </div>
          </div>

          <button 
            onClick={testAPI}
            className="w-full bg-[#00aa63] text-white py-2 px-4 rounded hover:bg-[#009955] transition-colors"
          >
            Test API Again
          </button>

          <button 
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Debug;
