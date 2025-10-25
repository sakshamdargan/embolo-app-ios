import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';

// Configure axios for WordPress API
const API_BASE_URL = 'https://embolo.in/wp-json/eco-swift/v1';

// iOS-compatible HTTP client wrapper
const makeRequest = async (config: any): Promise<any> => {
  // Use CapacitorHttp for iOS to avoid CORS issues
  if (Capacitor.isNativePlatform()) {
    const token = localStorage.getItem('eco_swift_token');
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Build full URL
    const url = config.url?.startsWith('http') 
      ? config.url 
      : `${API_BASE_URL}${config.url}`;
    
    console.log(`📱 iOS Address Request: ${config.method || 'GET'} ${url}`);
    
    try {
      const response: HttpResponse = await CapacitorHttp.request({
        method: config.method || 'GET',
        url,
        headers,
        data: config.data,
        params: config.params,
      });
      
      // Handle sliding session token
      if (response.headers['x-jwt-token']) {
        localStorage.setItem('eco_swift_token', response.headers['x-jwt-token']);
      }
      
      console.log(`📱 iOS Address Response: ${response.status}`, response.data);
      
      // Format response to match axios structure
      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error: any) {
      console.error(`📱 iOS Address Request Error:`, error);
      
      // Handle 401 errors
      if (error.status === 401) {
        localStorage.removeItem('eco_swift_token');
        localStorage.removeItem('eco_swift_user');
      }
      
      throw error;
    }
  }
  
  // Use axios for web
  return axios(config);
};

const addressAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token (for web)
addressAPI.interceptors.request.use(
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

// Add response interceptor to handle auth errors (for web)
addressAPI.interceptors.response.use(
  (response) => {
    // 🔄 SLIDING SESSION: Update token if backend sent a new one
    const newToken = response.headers['x-jwt-token'];
    if (newToken) {
      localStorage.setItem('eco_swift_token', newToken);
    }
    return response;
  },
  (error) => {
    // 🔄 SLIDING SESSION: Update token even in error responses
    if (error.response?.headers?.['x-jwt-token']) {
      const newToken = error.response.headers['x-jwt-token'];
      localStorage.setItem('eco_swift_token', newToken);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('eco_swift_token');
      localStorage.removeItem('eco_swift_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Address {
  id: string;
  type: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
  is_default_billing: boolean;
  is_default_shipping: boolean;
}

export interface AddressFormData {
  type: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country?: string;
  phone?: string;
  is_default?: boolean;
}

class AddressService {
  // Get all user addresses
  async getAddresses(): Promise<Address[]> {
    try {
      const response = await makeRequest({
        method: 'GET',
        url: '/addresses',
        baseURL: API_BASE_URL
      });
      return response.data.data || [];
    } catch (error) {
      throw error;
    }
  }

  // Add new address
  async addAddress(addressData: AddressFormData): Promise<Address> {
    try {
      const response = await makeRequest({
        method: 'POST',
        url: '/addresses',
        baseURL: API_BASE_URL,
        data: addressData
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Update existing address
  async updateAddress(id: string, addressData: Partial<AddressFormData>): Promise<Address> {
    try {
      const response = await makeRequest({
        method: 'PUT',
        url: `/addresses/${id}`,
        baseURL: API_BASE_URL,
        data: addressData
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete address
  async deleteAddress(id: string): Promise<void> {
    try {
      await makeRequest({
        method: 'DELETE',
        url: `/addresses/${id}`,
        baseURL: API_BASE_URL
      });
    } catch (error) {
      throw error;
    }
  }

  // Set default address
  async setDefaultAddress(id: string, type: 'billing' | 'shipping'): Promise<void> {
    try {
      await makeRequest({
        method: 'PUT',
        url: `/addresses/${id}/default`,
        baseURL: API_BASE_URL,
        data: { type }
      });
    } catch (error) {
      throw error;
    }
  }

  // Get default address by type
  getDefaultAddress(addresses: Address[], type: 'billing' | 'shipping'): Address | null {
    return addresses.find(addr => 
      type === 'billing' ? addr.is_default_billing : addr.is_default_shipping
    ) || null;
  }

  // Format address for display
  formatAddress(address: Address): string {
    const parts = [
      address.address_1,
      address.address_2,
      address.city,
      address.state,
      address.postcode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  // Validate address data
  validateAddress(addressData: AddressFormData): string[] {
    const errors: string[] = [];
    
    if (!addressData.first_name?.trim()) {
      errors.push('First name is required');
    }
    
    if (!addressData.last_name?.trim()) {
      errors.push('Last name is required');
    }
    
    if (!addressData.address_1?.trim()) {
      errors.push('Address is required');
    }
    
    if (!addressData.city?.trim()) {
      errors.push('City is required');
    }
    
    if (!addressData.state?.trim()) {
      errors.push('State is required');
    }
    
    if (!addressData.postcode?.trim()) {
      errors.push('PIN code is required');
    } else if (!/^\d{6}$/.test(addressData.postcode)) {
      errors.push('PIN code must be 6 digits');
    }
    
    if (!addressData.type || !['billing', 'shipping'].includes(addressData.type)) {
      errors.push('Address type is required');
    }
    
    return errors;
  }
}

export default new AddressService();
