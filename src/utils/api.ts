import axios from 'axios';

// Replace these with your actual WooCommerce credentials
const WC_BASE_URL = 'https://yourdomain.com/wp-json/wc/v3';
const DOKAN_BASE_URL = 'https://yourdomain.com/wp-json/dokan/v1';
const CONSUMER_KEY = 'your_consumer_key_here';
const CONSUMER_SECRET = 'your_consumer_secret_here';

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
      params: { search: searchTerm, per_page: 50 },
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
};
