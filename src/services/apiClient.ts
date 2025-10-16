import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Capacitor } from '@capacitor/core';

// API Configuration
const PRODUCTION_BASE_URL = 'https://embolo.in/wp-json/eco-swift/v1';
const DEVELOPMENT_BASE_URL = 'http://localhost:5173/api'; // Fallback for dev proxy
const REQUEST_TIMEOUT = 15000; // 15 seconds for mobile networks

/**
 * Determines the appropriate base URL based on the platform and environment
 */
function getBaseURL(): string {
  // Check if running on native platform (iOS/Android)
  if (Capacitor.isNativePlatform()) {
    console.log('🚀 Running on native platform, using production API');
    console.log(`📱 Platform: ${Capacitor.getPlatform()}`);
    return PRODUCTION_BASE_URL;
  }
  
  // Check if we're in development mode (localhost) - only for web
  try {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('🔧 Running on localhost, using development API');
        return DEVELOPMENT_BASE_URL;
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not access window.location, defaulting to production API');
  }
  
  // Default to production for web builds
  console.log('🌐 Running on web, using production API');
  return PRODUCTION_BASE_URL;
}

/**
 * Enhanced API client with iOS WKWebView compatibility
 */
class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = getBaseURL();
    console.log(`📡 API Client initialized with baseURL: ${this.baseURL}`);
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: Capacitor.isNativePlatform() ? 30000 : REQUEST_TIMEOUT, // Longer timeout for native
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // iOS specific configurations
      withCredentials: false,
      // Disable automatic request/response transformations that might cause issues
      transformRequest: [function (data) {
        return data ? JSON.stringify(data) : data;
      }],
      transformResponse: [function (data) {
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch (e) {
            return data;
          }
        }
        return data;
      }],
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle iOS WKWebView Origin header issues
        if (Capacitor.isNativePlatform()) {
          // Remove problematic headers for native platforms
          delete config.headers.Origin;
          delete config.headers.Referer;
          delete config.headers['User-Agent'];
          
          // Minimal headers for iOS - remove CORS headers as they're not needed for native
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          config.headers['Cache-Control'] = 'no-cache';
        }

        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`🔗 Full URL: ${config.baseURL}${config.url}`);
        console.log(`📋 Headers:`, config.headers);
        console.log(`📦 Data:`, config.data);
        console.log(`📱 Platform: ${Capacitor.getPlatform()}, Native: ${Capacitor.isNativePlatform()}`);

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`📥 API Response: ${response.status} ${response.config.url}`, {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('❌ API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });

        // Handle auth errors
        if (error.response?.status === 401) {
          this.handleAuthError();
        }

        // Enhanced error handling for network issues
        if (!error.response) {
          console.error('🌐 Network error - no response received');
          throw new Error('Network error. Please check your internet connection.');
        }

        return Promise.reject(error);
      }
    );
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem('eco_swift_token');
    } catch (error) {
      console.warn('⚠️ Failed to get token from localStorage:', error);
      return null;
    }
  }

  private handleAuthError(): void {
    try {
      localStorage.removeItem('eco_swift_token');
      localStorage.removeItem('eco_swift_user');
      
      // Only redirect if we're in a browser environment
      if (!Capacitor.isNativePlatform() && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.warn('⚠️ Failed to handle auth error:', error);
    }
  }

  /**
   * Safe JSON parsing with error handling
   */
  private safeParseResponse(response: AxiosResponse): any {
    try {
      // If response.data is already an object, return it
      if (typeof response.data === 'object') {
        return response.data;
      }
      
      // If it's a string, try to parse it
      if (typeof response.data === 'string') {
        return JSON.parse(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to parse response JSON:', error);
      throw new Error('Invalid response format from server');
    }
  }

  /**
   * Generic request method with enhanced error handling
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request(config);
      return this.safeParseResponse(response);
    } catch (error: any) {
      // Enhanced error message for common issues
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        throw new Error('Network timeout. Please check your connection and try again.');
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }


  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Check if running on native platform
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing API connectivity...');
      console.log(`🔗 Testing URL: ${this.baseURL}/auth/request-otp`);
      
      const response = await this.post('/auth/request-otp', { username: 'test@example.com' });
      console.log('✅ API connection test successful:', response);
      return true;
    } catch (error: any) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;
