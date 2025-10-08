import axios from 'axios';
import productService, { Product as NewProduct, Category as NewCategory } from '../services/productService';
import orderService, { Order as NewOrder, CreateOrderData } from '../services/orderService';
import authService from '../services/authService';

// Legacy WooCommerce credentials (kept for backward compatibility)
const WC_BASE_URL = 'https://embolo.in/wp-json/wc/v3';
const DOKAN_BASE_URL = 'https://embolo.in/wp-json/dokan/v1';
const JWT_BASE_URL = 'https://embolo.in/wp-json/jwt-auth/v1';
const CONSUMER_KEY = 'ck_f5bd6e9c34ae6c33b6bd7e3d4d7959a2f827cc9b';
const CONSUMER_SECRET = 'cs_15789a6d36171155132cb8bcb36192570ef01f57';

const wooCommerceAPI = axios.create({
  baseURL: WC_BASE_URL,
  auth: {
    username: CONSUMER_KEY,
    password: CONSUMER_SECRET,
  },
});

const dokanAPI = axios.create({
  baseURL: DOKAN_BASE_URL,
});

const jwtAPI = axios.create({
  baseURL: JWT_BASE_URL,
});

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('auth_token');

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Product {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: Array<{ src: string; alt: string }>;
  stock_quantity: number | null;
  stock_status: string;
  description?: string; // Make optional to match productService
  short_description: string;
  categories: Array<{ id: number; name: string }>;
  store?: {
    id: number;
    name: string;
    url: string;
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: { src: string } | null;
  count: number;
}

export interface Order {
  id: number;
  status: string;
  total: string;
  date_created: string;
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
    image?: { src: string };
  }>;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export interface Store {
  id: number;
  store_name: string;
  vendor_name: string;
  banner: string;
  avatar: string;
  address: {
    street_1: string;
    city: string;
    country: string;
  };
}

export const api = {
  // Products - Updated to use custom endpoints with server-side vendor filtering
  getProducts: async (page = 1, perPage = 20, vendorIds?: number[]) => {
    try {
      const params: any = { page, per_page: perPage };
      
      // Add vendor filtering if specific vendors are selected
      if (vendorIds && vendorIds.length > 0) {
        params.vendor = vendorIds.join(',');
      }
      
      const response = await productService.getProducts(params);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  },

  searchProducts: async (searchTerm: string, vendorIds?: number[]) => {
    try {
      const params: any = { q: searchTerm, per_page: 20 };
      
      // Add vendor filtering if specific vendors are selected
      if (vendorIds && vendorIds.length > 0) {
        params.vendor = vendorIds.join(',');
      }
      
      const response = await productService.searchProducts(params);
      return response.data;
    } catch (error: any) {
      console.error('API Search Error:', error?.message);
      throw error;
    }
  },

  getProduct: async (id: number) => {
    try {
      const response = await productService.getProduct(id);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw error;
    }
  },

  // Categories - Updated to use custom endpoints
  getCategories: async () => {
    try {
      const response = await productService.getCategories({ per_page: 50 });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  },

  // Stores/Vendors - Custom endpoint
  getStores: async () => {
    try {
      const response = await productService.getVendors({ per_page: 50 });
      return response.data;
    } catch (error) {
      console.error('Error fetching stores:', error);
      return [];
    }
  },

  getStoreProducts: async (storeId: number) => {
    try {
      const response = await productService.getProducts({ vendor: storeId, per_page: 50 });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch store products:', error);
      return [];
    }
  },

  // Orders - Updated to use custom endpoints
  createOrder: async (orderData: CreateOrderData) => {
    try {
      const response = await orderService.createOrder(orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  },

  getOrders: async (customerId?: number) => {
    try {
      const response = await orderService.getOrders();
      return response.data;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  },

  getOrder: async (id: number) => {
    try {
      const response = await orderService.getOrder(id);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  },


  // Authentication - Updated to use custom auth service
  login: async (username: string, otp: string) => {
    try {
      const response = await authService.login(username, otp);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (registrationData: any) => {
    try {
      const response = await authService.register(registrationData);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  logout: () => {
    authService.logout();
  },

  getCurrentUser: async () => {
    return authService.getCurrentUser();
  },

  isAuthenticated: () => {
    return authService.isAuthenticated();
  },

  // New methods for enhanced functionality
  getFeaturedProducts: async () => {
    try {
      const response = await productService.getFeaturedProducts(10);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      return [];
    }
  },

  getProductsByCategory: async (categoryId: number, page = 1, perPage = 20) => {
    try {
      const response = await productService.getProductsByCategory(categoryId, { page, per_page: perPage });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products by category:', error);
      return [];
    }
  },

  requestOTP: async (username: string) => {
    try {
      const response = await authService.requestLoginOTP(username);
      return response;
    } catch (error) {
      console.error('Failed to request OTP:', error);
      throw error;
    }
  },
};
