import axios from 'axios';

// Live WooCommerce credentials
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
  description: string;
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
  // Products
  getProducts: async (page = 1, perPage = 20) => {
    const response = await wooCommerceAPI.get<Product[]>('/products', {
      params: { page, per_page: perPage, status: 'publish' },
    });
    return response.data;
  },

  searchProducts: async (searchTerm: string) => {
    const response = await wooCommerceAPI.get<Product[]>('/products', {
      params: { search: searchTerm, per_page: 100, status: 'publish' },
    });
    return response.data;
  },

  getProduct: async (id: number) => {
    const response = await wooCommerceAPI.get<Product>(`/products/${id}`);
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await wooCommerceAPI.get<Category[]>('/products/categories', {
      params: { per_page: 50 },
    });
    return response.data;
  },

  // Orders
  createOrder: async (orderData: {
    line_items: Array<{ product_id: number; quantity: number }>;
    billing: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      address_1: string;
      city: string;
      postcode: string;
      country: string;
    };
  }) => {
    const response = await wooCommerceAPI.post<Order>('/orders', {
      ...orderData,
      payment_method: 'cod',
      payment_method_title: 'Cash on Delivery',
      set_paid: false,
      status: 'pending',
    });
    return response.data;
  },

  getOrders: async (customerId?: number) => {
    const response = await wooCommerceAPI.get<Order[]>('/orders', {
      params: customerId ? { customer: customerId } : {},
    });
    return response.data;
  },

  getOrder: async (id: number) => {
    const response = await wooCommerceAPI.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Dokan - Stores/Vendors
  getStores: async () => {
    try {
      const response = await dokanAPI.get<Store[]>('/stores', {
        params: { per_page: 50 },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stores:', error);
      return [];
    }
  },

  getStoreProducts: async (storeId: number) => {
    const response = await wooCommerceAPI.get<Product[]>('/products', {
      params: { vendor: storeId, per_page: 50 },
    });
    return response.data;
  },

  // Authentication
  login: async (username: string, password: string) => {
    const response = await jwtAPI.post('/token', { username, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_email', response.data.user_email);
      localStorage.setItem('user_id', response.data.user_id);
    }
    return response.data;
  },

  register: async (email: string, password: string, firstName?: string, lastName?: string) => {
    const response = await wooCommerceAPI.post('/customers', {
      email,
      password,
      first_name: firstName || '',
      last_name: lastName || '',
      username: email,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
  },

  getCurrentUser: async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return null;
    
    const response = await wooCommerceAPI.get(`/customers/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  },
};
