import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';

// Configure for WordPress API
const API_BASE_URL = 'https://embolo.in/wp-json/eco-swift/v1';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eco_swift_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('eco_swift_token');
      localStorage.removeItem('eco_swift_user');
      if (!Capacitor.isNativePlatform() && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  business_type: string;
  shop_name: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  token: string;
  user: User;
  message: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
}

export interface LicenseData {
  has_license_20?: boolean;
  license_20_number?: string;
  license_20_expiry?: string;
  has_license_21?: boolean;
  license_21_number?: string;
  license_21_expiry?: string;
}

export interface RegistrationData {
  phone: string;
  email: string;
  otp: string;
  shop_name: string;
  owner_first_name: string;
  owner_last_name: string;
  business_type: string;
  license_data?: LicenseData;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

class AuthService {
  /**
   * Enhanced HTTP request method with detailed debugging
   * Uses CapacitorHttp for native platforms, axios for web
   */
  private async makeRequest(endpoint: string, data: any, method: 'POST' | 'GET' = 'POST'): Promise<any> {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('eco_swift_token');
    
    console.log('🔵 ============ REQUEST START ============');
    console.log('🔵 Platform:', Capacitor.getPlatform());
    console.log('🔵 Is Native:', Capacitor.isNativePlatform());
    console.log('🔵 Method:', method);
    console.log('🔵 Endpoint:', endpoint);
    console.log('🔵 Full URL:', fullUrl);
    console.log('🔵 Request Data:', JSON.stringify(data, null, 2));
    console.log('🔵 Timestamp:', new Date().toISOString());
    
    try {
      let response: any;
      
      // Use CapacitorHttp for native platforms (better iOS support)
      if (Capacitor.isNativePlatform()) {
        console.log('🔵 Using CapacitorHttp for native platform');
        
        const options = {
          url: fullUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          data: data
        };
        
        console.log('🔵 Request Options:', JSON.stringify(options, null, 2));
        
        const capacitorResponse: HttpResponse = await CapacitorHttp.post(options);
        
        console.log('🔵 Response Status:', capacitorResponse.status);
        console.log('🔵 Response Headers:', JSON.stringify(capacitorResponse.headers, null, 2));
        console.log('🔵 Response Data:', JSON.stringify(capacitorResponse.data, null, 2));
        
        if (capacitorResponse.status >= 200 && capacitorResponse.status < 300) {
          response = capacitorResponse.data;
        } else {
          console.error('🔴 HTTP Error:', capacitorResponse.status);
          throw new Error(capacitorResponse.data?.message || `HTTP ${capacitorResponse.status} Error`);
        }
      } else {
        // Use axios for web platform
        console.log('🔵 Using axios for web platform');
        
        const axiosResponse = await authAPI.post(endpoint, data);
        
        console.log('🔵 Response Status:', axiosResponse.status);
        console.log('🔵 Response Data:', JSON.stringify(axiosResponse.data, null, 2));
        
        response = axiosResponse.data;
      }
      
      console.log('✅ ============ REQUEST SUCCESS ============');
      return response;
      
    } catch (error: any) {
      console.error('🔴 ============ REQUEST FAILED ============');
      console.error('🔴 Error Name:', error.name);
      console.error('🔴 Error Message:', error.message);
      console.error('🔴 Error Code:', error.code);
      console.error('🔴 Error Response:', error.response ? JSON.stringify(error.response.data, null, 2) : 'No response');
      console.error('🔴 Error Stack:', error.stack);
      console.error('🔴 Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Provide detailed error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
        console.error('🔴 DIAGNOSIS: Network connectivity issue');
        throw new Error('Network Error: Cannot connect to server. Please check your internet connection.');
      } else if (error.message?.includes('timeout')) {
        console.error('🔴 DIAGNOSIS: Request timeout');
        throw new Error('Request timed out. Please check your connection and try again.');
      } else if (error.response?.status === 0) {
        console.error('🔴 DIAGNOSIS: CORS or network blocking issue');
        throw new Error('Connection blocked. Please check network settings.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Request failed');
      }
    }
  }

  // Request OTP for login
  async requestLoginOTP(username: string): Promise<OTPResponse> {
    try {
      const response = await this.makeRequest('/auth/request-otp', { username });
      return response;
    } catch (error: any) {
      console.error('❌ requestLoginOTP failed:', error);
      throw error;
    }
  }

  // Request OTP for registration
  async requestRegisterOTP(phone: string, email: string): Promise<OTPResponse> {
    try {
      const response = await this.makeRequest('/auth/register-otp', { phone, email });
      return response;
    } catch (error: any) {
      console.error('❌ requestRegisterOTP failed:', error);
      throw error;
    }
  }

  // Login with OTP
  async login(username: string, otp: string): Promise<LoginResponse> {
    try {
      const data = await this.makeRequest('/auth/login', { username, otp });
      
      if (data.success && data.token) {
        localStorage.setItem('eco_swift_token', data.token);
        localStorage.setItem('eco_swift_user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ login failed:', error);
      throw error;
    }
  }

  // Register with OTP
  async register(registrationData: RegistrationData): Promise<RegisterResponse> {
    try {
      const data = await this.makeRequest('/auth/register', registrationData);
      
      if (data.success && data.token) {
        localStorage.setItem('eco_swift_token', data.token);
        localStorage.setItem('eco_swift_user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ register failed:', error);
      throw error;
    }
  }

  // Validate current token
  async validateToken(): Promise<boolean> {
    try {
      const response = await authAPI.post('/auth/validate');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  // Refresh token
  async refreshToken(): Promise<string | null> {
    try {
      const response = await authAPI.post('/auth/refresh');
      if (response.data.success && response.data.token) {
        localStorage.setItem('eco_swift_token', response.data.token);
        return response.data.token;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem('eco_swift_token');
    localStorage.removeItem('eco_swift_user');
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('eco_swift_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  // Get user profile with complete data from server
  async getUserProfile(): Promise<User | null> {
    try {
      const response = await authAPI.get('/auth/profile');
      if (response.data.success) {
        const userData = response.data.user;
        // Update localStorage with complete user data
        localStorage.setItem('eco_swift_user', JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('eco_swift_token');
  }

  // Get current token
  getToken(): string | null {
    return localStorage.getItem('eco_swift_token');
  }

  // Format phone number
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    return phone;
  }

  // Validate email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone
  isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
  }

  // Validate OTP
  isValidOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }
}

export default new AuthService();
