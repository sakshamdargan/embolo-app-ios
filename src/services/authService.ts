import axios from 'axios';

// Configure axios for WordPress API
const API_BASE_URL = 'https://embolo.in/wp-json/eco-swift/v1';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      window.location.href = '/login';
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
  // Request OTP for login
  async requestLoginOTP(username: string): Promise<OTPResponse> {
    try {
      const response = await authAPI.post('/auth/request-otp', { username });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send verification code');
    }
  }

  // Request OTP for registration
  async requestRegisterOTP(phone: string, email: string): Promise<OTPResponse> {
    try {
      const response = await authAPI.post('/auth/register-otp', { phone, email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send verification code');
    }
  }

  // Login with OTP
  async login(username: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await authAPI.post('/auth/login', { username, otp });
      const data = response.data;
      
      if (data.success && data.token) {
        localStorage.setItem('eco_swift_token', data.token);
        localStorage.setItem('eco_swift_user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  // Register with OTP
  async register(registrationData: RegistrationData): Promise<RegisterResponse> {
    try {
      const response = await authAPI.post('/auth/register', registrationData);
      const data = response.data;
      
      if (data.success && data.token) {
        localStorage.setItem('eco_swift_token', data.token);
        localStorage.setItem('eco_swift_user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
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
