import axios from 'axios';

// Configure axios for WordPress API
const API_BASE_URL = 'https://embolo.in/wp-json/eco-swift/v1';

const addressAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
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

// Add response interceptor to handle auth errors
addressAPI.interceptors.response.use(
  (response) => {
    // 🔄 SLIDING SESSION: Update token if backend sent a new one
    const newToken = response.headers['x-jwt-token'];
    if (newToken) {
      console.log('🔄 Token extended (address API)! Updating localStorage...');
      localStorage.setItem('eco_swift_token', newToken);
    }
    return response;
  },
  (error) => {
    // 🔄 SLIDING SESSION: Update token even in error responses
    if (error.response?.headers?.['x-jwt-token']) {
      const newToken = error.response.headers['x-jwt-token'];
      console.log('🔄 Token extended (address API)! Updating localStorage...');
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
      const response = await addressAPI.get('/addresses');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  }

  // Add new address
  async addAddress(addressData: AddressFormData): Promise<Address> {
    try {
      const response = await addressAPI.post('/addresses', addressData);
      return response.data.data;
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  // Update existing address
  async updateAddress(id: string, addressData: Partial<AddressFormData>): Promise<Address> {
    try {
      const response = await addressAPI.put(`/addresses/${id}`, addressData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  // Delete address
  async deleteAddress(id: string): Promise<void> {
    try {
      await addressAPI.delete(`/addresses/${id}`);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  // Set default address
  async setDefaultAddress(id: string, type: 'billing' | 'shipping'): Promise<void> {
    try {
      await addressAPI.put(`/addresses/${id}/default`, { type });
    } catch (error) {
      console.error('Error setting default address:', error);
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
